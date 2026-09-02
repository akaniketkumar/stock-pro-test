// Vercel Serverless Function — GET /api/candles?symbol=RELIANCE&range=1y
//
// Fetches REAL historical OHLCV candles for an NSE stock from Yahoo
// Finance's public chart endpoint. No API key, no account. Used to draw the
// price chart and to compute real technical indicators (SMA/RSI/MACD) —
// nothing here is generated or guessed.
//
// Some (range, interval) combinations occasionally come back empty or very
// thin for certain symbols (especially small/mid-caps) — rather than
// silently falling back to the frontend's fake generator, we retry a chain
// of progressively safer real combinations for the same UI timeframe first.

// UI timeframe -> ordered list of (range, interval) attempts, most precise
// first. We stop at the first attempt that returns a usable amount of data.
const RANGE_CHAINS = {
  '1d': [
    { range: '1d', interval: '5m' },
    { range: '5d', interval: '15m' },
    { range: '1mo', interval: '1d' },
  ],
  '1wk': [
    { range: '5d', interval: '15m' },
    { range: '1mo', interval: '1d' },
  ],
  '1mo': [
    { range: '1mo', interval: '1d' },
    { range: '3mo', interval: '1d' },
  ],
  '3mo': [
    { range: '3mo', interval: '1d' },
    { range: '6mo', interval: '1d' },
  ],
  '6mo': [
    { range: '6mo', interval: '1d' },
    { range: '1y', interval: '1d' },
  ],
  '1y': [
    { range: '1y', interval: '1d' },
    { range: '2y', interval: '1d' },
  ],
  '2y': [
    { range: '2y', interval: '1d' },
    { range: '5y', interval: '1wk' },
  ],
  '5y': [
    { range: '5y', interval: '1wk' },
    { range: '5y', interval: '1d' },
    { range: '2y', interval: '1d' },
  ],
  max: [
    { range: 'max', interval: '1mo' },
    { range: 'max', interval: '1wk' },
    { range: '10y', interval: '1d' },
    { range: '5y', interval: '1d' },
  ],
}

const MIN_USABLE_CANDLES = 5

async function fetchYahoo(yahooSymbol, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=${interval}`
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'application/json',
    },
  })
  if (!response.ok) return { candles: null, error: `Yahoo Finance returned ${response.status}` }

  const json = await response.json()
  const result = json?.chart?.result?.[0]
  const timestamps = result?.timestamp
  const quote = result?.indicators?.quote?.[0]
  if (!timestamps || !quote) return { candles: null, error: 'No historical data for this symbol' }

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

  return { candles, error: null }
}

export default async function handler(req, res) {
  const { symbol, range } = req.query

  if (!symbol) {
    return res.status(200).json({ success: false, error: 'symbol is required', candles: [] })
  }

  const cleanSymbol = String(symbol).toUpperCase().trim()
  const yahooSymbol = `${cleanSymbol}.NS`
  const chain = RANGE_CHAINS[range] || RANGE_CHAINS['1y']

  let lastError = 'No historical data for this symbol'
  let usedInterval = chain[0].interval

  try {
    for (const attempt of chain) {
      const { candles, error } = await fetchYahoo(yahooSymbol, attempt.range, attempt.interval)
      if (candles && candles.length >= MIN_USABLE_CANDLES) {
        const cacheSeconds = attempt.interval.endsWith('m') ? 60 : 900
        res.setHeader('Cache-Control', `s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 4}`)
        return res.status(200).json({
          success: true,
          symbol: cleanSymbol,
          interval: attempt.interval,
          requestedRange: attempt.range,
          count: candles.length,
          candles,
        })
      }
      if (error) lastError = error
      usedInterval = attempt.interval
    }

    return res.status(200).json({ success: false, error: lastError, interval: usedInterval, candles: [] })
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message, candles: [] })
  }
}
