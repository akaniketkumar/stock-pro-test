// Vercel Serverless Function — GET /api/profile?symbol=RELIANCE
//
// Fetches real fundamental data from Yahoo Finance's quoteSummary endpoint —
// market cap, P/E, book value, ROE, debt/equity, sector, industry, and even
// a real company business description. This is what lets ANY company
// (not just our ~27 hand-curated ones) show genuine numbers instead of
// dashes or a generic one-line description.

export default async function handler(req, res) {
  const { symbol } = req.query
  if (!symbol) {
    return res.status(400).json({ success: false, error: 'symbol is required' })
  }

  const cleanSymbol = String(symbol).toUpperCase().trim()
  const yahooSymbol = `${cleanSymbol}.NS`

  try {
    const modules = 'assetProfile,summaryDetail,defaultKeyStatistics,financialData'
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}?modules=${modules}`

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
      },
    })

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
