// Vercel Serverless Function — GET /api/candles?symbol=RELIANCE&range=1y
//
// Fetches REAL historical daily OHLCV candles for an NSE stock from Yahoo
// Finance's public chart endpoint. No API key, no account. Used to draw the
// price chart and to compute real technical indicators (SMA/RSI/MACD) —
// nothing here is generated or guessed.

export default async function handler(req, res) {
  const { symbol, range } = req.query

  if (!symbol) {
    return res.status(200).json({ success: false, error: 'symbol is required', candles: [] })
  }

  const cleanSymbol = String(symbol).toUpperCase().trim()
  const yahooSymbol = `${cleanSymbol}.NS`
  const safeRange = ['3mo', '6mo', '1y', '2y', '5y'].includes(range) ? range : '1y'

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${safeRange}&interval=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return res.status(200).json({ success: false, error: `Yahoo Finance returned ${response.status}`, candles: [] })
    }

    const json = await response.json()
    const result = json?.chart?.result?.[0]
    const timestamps = result?.timestamp
    const quote = result?.indicators?.quote?.[0]

    if (!timestamps || !quote) {
      return res.status(200).json({ success: false, error: 'No historical data for this symbol', candles: [] })
    }

    const candles = timestamps
      .map((t, i) => {
        const open = quote.open?.[i]
        const high = quote.high?.[i]
        const low = quote.low?.[i]
        const close = quote.close?.[i]
        const volume = quote.volume?.[i]
        if (open == null || high == null || low == null || close == null) return null
        return {
          date: new Date(t * 1000).toISOString().slice(0, 10),
          open,
          high,
          low,
          close,
          volume: volume || 0,
        }
      })
      .filter(Boolean)

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600')

    return res.status(200).json({ success: true, symbol: cleanSymbol, count: candles.length, candles })
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message, candles: [] })
  }
}
