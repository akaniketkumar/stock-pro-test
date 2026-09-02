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

  // UI timeframe -> Yahoo's own range + interval params. Short timeframes
  // need an intraday interval; long ones need a coarser interval or Yahoo
  // rejects/truncates the request.
  const RANGE_MAP = {
    '1d': { range: '1d', interval: '5m' },
    '1wk': { range: '5d', interval: '15m' },
    '1mo': { range: '1mo', interval: '1d' },
    '3mo': { range: '3mo', interval: '1d' },
    '6mo': { range: '6mo', interval: '1d' },
    '1y': { range: '1y', interval: '1d' },
    '2y': { range: '2y', interval: '1d' },
    '5y': { range: '5y', interval: '1wk' },
    max: { range: 'max', interval: '1mo' },
  }
  const { range: safeRange, interval } = RANGE_MAP[range] || RANGE_MAP['1y']

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${safeRange}&interval=${interval}`

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
        const iso = new Date(t * 1000).toISOString()
        return {
          date: interval.endsWith('m') ? iso : iso.slice(0, 10),
          time: t,
          open,
          high,
          low,
          close,
          volume: volume || 0,
        }
      })
      .filter(Boolean)

    // Cache short-timeframe (intraday) data for less time since it moves fast.
    const cacheSeconds = interval.endsWith('m') ? 60 : 900
    res.setHeader('Cache-Control', `s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 4}`)

    return res.status(200).json({ success: true, symbol: cleanSymbol, interval, count: candles.length, candles })
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message, candles: [] })
  }
}
