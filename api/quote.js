// Vercel Serverless Function — GET /api/quote?symbol=RELIANCE
//
// Fetches a real, live price quote for an NSE-listed stock from Yahoo
// Finance's public chart endpoint. This needs NO API key and NO account —
// it runs on the server (not the browser) so there are no CORS issues.
//
// Always responds with HTTP 200. Check the `success` field in the body:
// success: true  -> real data in the response
// success: false -> live fetch failed right now (frontend falls back honestly)

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
    })
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message })
  }
}
