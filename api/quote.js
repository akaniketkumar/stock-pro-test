// Vercel Serverless Function — GET /api/quote?symbol=RELIANCE
//
// Fetches a real, live price quote for an NSE-listed stock from Yahoo
// Finance's public chart endpoint. This needs NO API key and NO account —
// it runs on the server (not the browser) so there are no CORS issues.
//
// Always responds with HTTP 200. Check the `success` field in the body:
// success: true  -> real data in the response
// success: false -> live fetch failed right now (frontend falls back honestly)

// Best-effort fetch of real fundamentals (market cap, P/E, book value, EPS)
// from Yahoo's quote endpoint. This is a secondary, less-guaranteed source
// than the chart endpoint above — if it fails or is blocked, we simply omit
// these fields rather than inventing a number, so the frontend can fall back
// to an honestly-labeled estimate instead of a silently wrong real-looking one.
async function fetchFundamentals(yahooSymbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbol)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
      },
    })
    if (!response.ok) return null
    const json = await response.json()
    const q = json?.quoteResponse?.result?.[0]
    if (!q) return null
    return {
      marketCap: typeof q.marketCap === 'number' ? Math.round(q.marketCap / 1e7) : null, // raw INR -> Cr
      pe: typeof q.trailingPE === 'number' ? q.trailingPE : null,
      bookValue: typeof q.bookValue === 'number' ? q.bookValue : null,
      eps: typeof q.epsTrailingTwelveMonths === 'number' ? q.epsTrailingTwelveMonths : null,
      dividendYield: typeof q.trailingAnnualDividendYield === 'number' ? q.trailingAnnualDividendYield * 100 : null,
    }
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  const { symbol, yahooSymbol: rawYahooSymbol } = req.query

  if (!symbol && !rawYahooSymbol) {
    return res.status(200).json({ success: false, error: 'symbol is required' })
  }

  const cleanSymbol = String(symbol || rawYahooSymbol).toUpperCase().trim()
  // Indices and forex pairs pass their exact Yahoo ticker (e.g. ^NSEI, INR=X)
  // via yahooSymbol so we don't wrongly append ".NS" to it.
  const yahooSymbol = rawYahooSymbol ? String(rawYahooSymbol).trim() : `${cleanSymbol}.NS`

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1m`

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        error: `Yahoo Finance returned ${response.status}`,
      })
    }

    const json = await response.json()
    const result = json?.chart?.result?.[0]
    const meta = result?.meta

    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      return res.status(200).json({ success: false, error: 'No live data for this symbol' })
    }

    const price = meta.regularMarketPrice
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price
    const change = price - prevClose
    const changePct = prevClose ? (change / prevClose) * 100 : 0

    // Only attempt the fundamentals lookup for actual equities (not
    // indices/forex, which don't have marketCap/PE anyway).
    const fundamentals = rawYahooSymbol ? null : await fetchFundamentals(yahooSymbol)

    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=45')

    return res.status(200).json({
      success: true,
      symbol: cleanSymbol,
      name: meta.longName || meta.shortName || null,
      price,
      change,
      changePct,
      open: meta.regularMarketOpen ?? null,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      fiftyTwoWHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWLow: meta.fiftyTwoWeekLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      currency: meta.currency ?? 'INR',
      exchangeName: meta.exchangeName ?? 'NSE',
      marketTime: meta.regularMarketTime ?? null,
      marketCap: fundamentals?.marketCap ?? null,
      pe: fundamentals?.pe ?? null,
      bookValue: fundamentals?.bookValue ?? null,
      eps: fundamentals?.eps ?? null,
      dividendYield: fundamentals?.dividendYield ?? null,
    })
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message })
  }
}
