// Vercel Serverless Function — GET /api/profile?symbol=RELIANCE
//
// Fetches real fundamental data from Yahoo Finance's quoteSummary endpoint —
// market cap, P/E, book value, ROE, debt/equity, sector, industry, and even
// a real company business description. This is what lets ANY company
// (not just our ~27 hand-curated ones) show genuine numbers instead of
// dashes or a generic one-line description.
//
// IMPORTANT: as of 2024+, Yahoo's quoteSummary endpoint requires a valid
// session cookie + CSRF "crumb" or it silently returns 401 Unauthorized —
// unlike the chart/search endpoints used elsewhere in this app, which stay
// open. So this function does the cookie+crumb handshake itself first.

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
}

// Cached at module scope so warm serverless invocations can reuse it instead
// of doing the cookie+crumb handshake on every single request.
let cachedAuth = null // { cookie, crumb, expiresAt }

async function getYahooAuth() {
  if (cachedAuth && cachedAuth.expiresAt > Date.now()) return cachedAuth

  // Step 1: hit Yahoo's own finance homepage to receive a session cookie.
  const cookieRes = await fetch('https://fc.yahoo.com', { headers: BROWSER_HEADERS, redirect: 'manual' })
  const setCookieHeader = cookieRes.headers.get('set-cookie') || ''
  const cookie = setCookieHeader.split(',').map((c) => c.split(';')[0]).join('; ')

  if (!cookie) return null

  // Step 2: use that cookie to fetch a matching CSRF crumb.
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { ...BROWSER_HEADERS, Cookie: cookie },
  })
  if (!crumbRes.ok) return null
  const crumb = (await crumbRes.text()).trim()
  if (!crumb || crumb.includes('<')) return null // got an HTML error page, not a crumb

  cachedAuth = { cookie, crumb, expiresAt: Date.now() + 25 * 60 * 1000 } // ~25 min reuse window
  return cachedAuth
}

export default async function handler(req, res) {
  const { symbol } = req.query
  if (!symbol) {
    return res.status(400).json({ success: false, error: 'symbol is required' })
  }

  const cleanSymbol = String(symbol).toUpperCase().trim()
  const yahooSymbol = `${cleanSymbol}.NS`

  try {
    const auth = await getYahooAuth()
    if (!auth) {
      return res.status(200).json({ success: false, error: 'Could not authenticate with Yahoo Finance' })
    }

    const modules = 'assetProfile,summaryDetail,defaultKeyStatistics,financialData'
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}?modules=${modules}&crumb=${encodeURIComponent(auth.crumb)}`

    let response = await fetch(url, { headers: { ...BROWSER_HEADERS, Cookie: auth.cookie } })

    // If the cached crumb went stale, refresh once and retry.
    if (response.status === 401) {
      cachedAuth = null
      const freshAuth = await getYahooAuth()
      if (freshAuth) {
        const retryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}?modules=${modules}&crumb=${encodeURIComponent(freshAuth.crumb)}`
        response = await fetch(retryUrl, { headers: { ...BROWSER_HEADERS, Cookie: freshAuth.cookie } })
      }
    }

    if (!response.ok) {
      return res.status(200).json({ success: false, error: `Yahoo returned ${response.status}` })
    }

    const json = await response.json()
    const result = json?.quoteSummary?.result?.[0]
    if (!result) {
      return res.status(200).json({ success: false, error: 'No profile data for this symbol' })
    }

    const raw = (v) => (v && typeof v === 'object' && 'raw' in v ? v.raw : v ?? null)

    const assetProfile = result.assetProfile || {}
    const summaryDetail = result.summaryDetail || {}
    const keyStats = result.defaultKeyStatistics || {}
    const financialData = result.financialData || {}

    const profile = {
      sector: assetProfile.sector || null,
      industry: assetProfile.industry || null,
      about: assetProfile.longBusinessSummary || null,
      website: assetProfile.website || null,
      employees: raw(assetProfile.fullTimeEmployees),
      city: assetProfile.city || null,
      country: assetProfile.country || null,

      marketCap: raw(summaryDetail.marketCap),
      pe: raw(summaryDetail.trailingPE),
      dividendYield: raw(summaryDetail.dividendYield) ? raw(summaryDetail.dividendYield) * 100 : null,
      fiftyTwoWHigh: raw(summaryDetail.fiftyTwoWeekHigh),
      fiftyTwoWLow: raw(summaryDetail.fiftyTwoWeekLow),

      pb: raw(keyStats.priceToBook),
      eps: raw(keyStats.trailingEps),
      bookValue: raw(keyStats.bookValue),
      beta: raw(keyStats.beta),
      sharesOutstanding: raw(keyStats.sharesOutstanding),

      roe: raw(financialData.returnOnEquity) != null ? raw(financialData.returnOnEquity) * 100 : null,
      roa: raw(financialData.returnOnAssets) != null ? raw(financialData.returnOnAssets) * 100 : null,
      debtToEquity: raw(financialData.debtToEquity) != null ? raw(financialData.debtToEquity) / 100 : null,
      currentRatio: raw(financialData.currentRatio),
      profitMargin: raw(financialData.profitMargins) != null ? raw(financialData.profitMargins) * 100 : null,
      revenueGrowth: raw(financialData.revenueGrowth) != null ? raw(financialData.revenueGrowth) * 100 : null,
      revenue: raw(financialData.totalRevenue),
      grossProfits: raw(financialData.grossProfits),
      operatingCashFlow: raw(financialData.operatingCashflow),
      freeCashFlow: raw(financialData.freeCashflow),
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return res.status(200).json({ success: true, symbol: cleanSymbol, profile })
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message })
  }
}
