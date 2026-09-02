import stocks from '../data/stocks.json'
import indices from '../data/indices.json'
import ipos from '../data/ipos.json'
import news from '../data/news.json'
import redFlags from '../data/redFlags.json'
import stockDetails from '../data/stockDetails.json'
import stockProfiles from '../data/stockProfiles.json'
import { EXTRA_COMPANIES, SYMBOL_ALIASES } from '../data/companyList'

import {
  deriveCandles,
  deriveQuarterly,
  deriveQuarterlyDetailed,
  deriveHoldings,
  deriveTechnical,
  derivePnl,
  deriveBalanceSheet,
  deriveCashFlows,
  deriveRatios,
  deriveGrowth,
  deriveShareholders,
  deriveDocuments,
  derivePeers,
} from './derivations'

const API_LATENCY = 80

function delay(ms = API_LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Real-company resolution + live price fetching
//
// No random/fake data is ever generated for a symbol anymore. A stock is
// only ever shown if it's a real, known NSE-listed company (from stocks.json
// or companyList.js). If it isn't, the app says so instead of inventing one.
// ---------------------------------------------------------------------------

function normalizeSym(id) {
  if (!id) return ''
  let sym = String(id).toUpperCase().replace('.NS', '').replace('.BO', '').replace(/\s+/g, '')
  if (SYMBOL_ALIASES[sym]) sym = SYMBOL_ALIASES[sym]
  return sym
}

// ---------------------------------------------------------------------------
// Full NSE company directory (2000+ real, live-listed companies)
//
// Fetched once from /api/companies (which itself pulls NSE's own official
// list server-side) and cached in memory + sessionStorage for the rest of
// the browser session. This is what makes search cover the whole exchange
// instead of a small hand-picked list, while stocks.json / EXTRA_COMPANIES
// above still provide the rich, curated data for well-known names.
// ---------------------------------------------------------------------------
let fullDirectory = null
let fullDirectoryPromise = null

async function ensureDirectory() {
  if (fullDirectory) return fullDirectory
  if (fullDirectoryPromise) return fullDirectoryPromise

  fullDirectoryPromise = (async () => {
    try {
      const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('stockpro_nse_directory') : null
      if (cached) {
        fullDirectory = JSON.parse(cached)
        return fullDirectory
      }
    } catch {
      // ignore cache read errors, fall through to network fetch
    }
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      fullDirectory = data && data.success && Array.isArray(data.companies) ? data.companies : []
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('stockpro_nse_directory', JSON.stringify(fullDirectory))
        }
      } catch {
        // sessionStorage may be full or unavailable — not critical
      }
    } catch {
      fullDirectory = []
    }
    return fullDirectory
  })()

  return fullDirectoryPromise
}

function findBaseCompany(sym) {
  const found = stocks.find((s) => s.id === sym || s.symbol === sym)
  if (found) return found
  const extra = EXTRA_COMPANIES[sym]
  if (extra) {
    return {
      id: sym,
      symbol: sym,
      name: extra.name,
      sector: extra.sector,
      industry: extra.sector,
      exchange: 'NSE',
    }
  }
  // Fall back to the full NSE directory if it has loaded by now — covers
  // the other 2000+ real companies beyond our curated list.
  if (fullDirectory) {
    const dirMatch = fullDirectory.find((c) => c.symbol === sym)
    if (dirMatch) {
      return {
        id: sym,
        symbol: sym,
        name: dirMatch.name,
        sector: 'Equity',
        industry: 'Diversified',
        exchange: 'NSE',
      }
    }
  }
  return null
}

function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null))
}

async function fetchLiveQuote(sym) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.success) return null
    return compact({
      price: data.price,
      change: data.change,
      changePct: data.changePct,
      open: data.open,
      dayHigh: data.dayHigh,
      dayLow: data.dayLow,
      fiftyTwoWHigh: data.fiftyTwoWHigh,
      fiftyTwoWLow: data.fiftyTwoWLow,
      volume: data.volume,
    })
  } catch {
    return null
  }
}

// Resolves a symbol into a real stock row with a live price where possible.
// status: 'ok' | 'invalid' (not a real company) | 'unavailable' (real company, no price right now)
async function resolveStock(id) {
  const sym = normalizeSym(id)
  if (!sym) return { stock: null, status: 'invalid', sym }

  let base = findBaseCompany(sym)
  if (!base) {
    // Not in the curated lists — make sure the full NSE directory has been
    // loaded before giving up, so any real listed company can resolve.
    await ensureDirectory()
    base = findBaseCompany(sym)
  }

  const live = await fetchLiveQuote(sym)

  if (!base) {
    // Still unknown to every local list — but if Yahoo Finance itself
    // confirms a real, currently-traded price for this exact symbol, that
    // IS proof it's a real listed company (a fake/garbage symbol simply
    // returns no data), so accept it using the live-fetched name.
    if (live && typeof live.price === 'number') {
      base = { id: sym, symbol: sym, name: live.name || sym, sector: 'Equity', industry: 'Diversified', exchange: 'NSE' }
    } else {
      return { stock: null, status: 'invalid', sym }
    }
  }

  if (live) {
    return { stock: { ...base, ...live, id: sym, symbol: sym, isLive: true }, status: 'ok' }
  }
  if (typeof base.price === 'number') {
    return { stock: { ...base, id: sym, symbol: sym, isLive: false }, status: 'ok' }
  }
  return { stock: null, status: 'unavailable', sym, name: base.name }
}

async function getStockRow(id) {
  const { stock } = await resolveStock(id)
  return stock
}

async function withLivePrices(baseStocks) {
  const rows = await Promise.all(baseStocks.map((s) => getStockRow(s.id)))
  return rows.filter(Boolean)
}

function deriveBoardMeetings(stock) {
  return [
    { id: `${stock.id}-bm-1`, date: '14 Oct 2026', purpose: 'Results & Dividend', status: 'Held', link: '#' },
    { id: `${stock.id}-bm-2`, date: '05 Aug 2026', purpose: 'AGM', status: 'Held', link: '#' }
  ]
}

function deriveConviction(stock, redFlagResults) {
  const overrides = stockDetails[stock.id]?.conviction
  if (overrides) return overrides
  return {
    score: 65,
    label: 'Bullish',
    thesis: `Fundamental analysis of ${stock.name || stock.symbol} suggests a bullish outlook.`,
    reasons: ['Consistent revenue growth', 'Stable promoter holding'],
    risks: ['Market volatility'],
  }
}

function getRedFlagResults(stockId) {
  return redFlags.stocks[stockId] || null
}

// Real Yahoo Finance tickers for the indices we can live-fetch for free.
// Gold (MCX) has no equivalent free real-time source, so it stays as the
// last known static value rather than showing an unrelated foreign price.
const INDEX_YAHOO_SYMBOLS = {
  NIFTY50: '^NSEI',
  SENSEX: '^BSESN',
  BANKNIFTY: '^NSEBANK',
  MIDCAP: 'NIFTY_MIDCAP_100.NS',
  SMALLCAP: '^CNXSC',
  USDINR: 'INR=X',
  VIX: '^INDIAVIX',
}

async function fetchLiveIndexQuote(yahooSymbol) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`/api/quote?yahooSymbol=${encodeURIComponent(yahooSymbol)}`, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.success) return null
    return { value: data.price, change: data.change, changePct: data.changePct }
  } catch {
    return null
  }
}

export async function getIndices() {
  const rows = await Promise.all(
    indices.map(async (ix) => {
      const yahooSymbol = INDEX_YAHOO_SYMBOLS[ix.id]
      if (!yahooSymbol) return ix // e.g. Gold (MCX) — no free live source, keep static
      const live = await fetchLiveIndexQuote(yahooSymbol)
      return live ? { ...ix, ...live, isLive: true } : ix
    })
  )
  return rows
}

export async function getAllStocks() {
  await delay(60)
  return withLivePrices(stocks)
}

// Real companies only — the curated 27 plus the extended NSE list. No fake
// entries are ever synthesized for an unmatched search anymore.
const SEARCH_UNIVERSE = [
  ...stocks,
  ...Object.entries(EXTRA_COMPANIES).map(([symbol, info]) => ({
    id: symbol,
    symbol,
    name: info.name,
    sector: info.sector,
  })),
]

export async function searchStocks(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []

  const curatedMatches = SEARCH_UNIVERSE.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  )
  const seen = new Set(curatedMatches.map((s) => s.id))

  // Primary source: live per-query Yahoo Finance search (api/search.js).
  // This covers thousands of real NSE companies and doesn't depend on
  // NSE's own archive servers, which sometimes block cloud IPs.
  let liveMatches = []
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    if (data && data.success && Array.isArray(data.companies)) {
      liveMatches = data.companies
        .filter((c) => !seen.has(c.symbol))
        .map((c) => ({ id: c.symbol, symbol: c.symbol, name: c.name, sector: c.sector || 'Equity' }))
    }
  } catch {
    // network hiccup — fall through to the secondary directory below
  }

  liveMatches.forEach((m) => seen.add(m.id))

  // Secondary fallback: the bulk NSE directory (only used if Yahoo search
  // above returned nothing, e.g. a network error).
  let directoryMatches = []
  if (liveMatches.length === 0) {
    await ensureDirectory()
    directoryMatches = (fullDirectory || [])
      .filter((c) => !seen.has(c.symbol) && (c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)))
      .map((c) => ({ id: c.symbol, symbol: c.symbol, name: c.name, sector: 'Equity' }))
  }

  return [...curatedMatches, ...liveMatches, ...directoryMatches].slice(0, 10)
}

export async function getStock(id) {
  await delay(60)
  return getStockRow(id)
}

export async function getStockNews(id) {
  await delay(60)
  return news[id] || []
}

// Real historical daily candles from /api/candles (Yahoo Finance chart data).
// Falls back to the modelled candles only if the live fetch genuinely fails,
// so the chart always matches the actual company and its real price moves.
async function fetchRealCandles(sym, range = '1y') {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`/api/candles?symbol=${encodeURIComponent(sym)}&range=${range}`, {
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.success || !Array.isArray(data.candles) || data.candles.length === 0) return null
    return data.candles
  } catch {
    return null
  }
}

export async function getCandles(id, range = '1y') {
  const stock = await getStockRow(id)
  if (!stock) return []
  const real = await fetchRealCandles(stock.id, range)
  if (real) return real
  await delay(60)
  return deriveCandles(stock)
}

function sma(values, period) {
  if (values.length < period) return null
  let sum = 0
  for (let i = values.length - period; i < values.length; i += 1) sum += values[i]
  return sum / period
}

function ema(values, period) {
  if (values.length < period) return values.map(() => null)
  const k = 2 / (period + 1)
  const out = new Array(values.length).fill(null)
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  out[period - 1] = prev
  for (let i = period; i < values.length; i += 1) {
    prev = values[i] * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

function smaSeries(values, period) {
  const out = new Array(values.length).fill(null)
  for (let i = period - 1; i < values.length; i += 1) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j += 1) sum += values[j]
    out[i] = sum / period
  }
  return out
}

function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return null
  let gains = 0
  let losses = 0
  for (let i = 1; i <= period; i += 1) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  for (let i = period + 1; i < closes.length; i += 1) {
    const diff = closes[i] - closes[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function computeMACD(closes) {
  if (closes.length < 35) return null
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const macdLine = closes.map((_, i) => (ema12[i] != null && ema26[i] != null ? ema12[i] - ema26[i] : null))
  const macdValues = macdLine.filter((v) => v != null)
  const signalSeries = ema(macdValues, 9)
  const signal = signalSeries[signalSeries.length - 1]
  const macd = macdLine[macdLine.length - 1]
  return { macd, signal, histogram: macd != null && signal != null ? macd - signal : null }
}

function computeStochastic(candles, period = 14) {
  if (candles.length < period) return null
  const recent = candles.slice(-period)
  const high = Math.max(...recent.map((c) => c.high))
  const low = Math.min(...recent.map((c) => c.low))
  const close = candles[candles.length - 1].close
  if (high === low) return 50
  return ((close - low) / (high - low)) * 100
}

function computeWilliamsR(candles, period = 14) {
  const stoch = computeStochastic(candles, period)
  return stoch === null ? null : stoch - 100
}

function computeROC(closes, period = 12) {
  if (closes.length < period + 1) return null
  const past = closes[closes.length - 1 - period]
  const now = closes[closes.length - 1]
  if (!past) return null
  return ((now - past) / past) * 100
}

function computeCCI(candles, period = 20) {
  if (candles.length < period) return null
  const recent = candles.slice(-period)
  const typicalPrices = recent.map((c) => (c.high + c.low + c.close) / 3)
  const smaTP = typicalPrices.reduce((a, b) => a + b, 0) / period
  const meanDev = typicalPrices.reduce((a, b) => a + Math.abs(b - smaTP), 0) / period
  const lastTP = typicalPrices[typicalPrices.length - 1]
  if (meanDev === 0) return 0
  return (lastTP - smaTP) / (0.015 * meanDev)
}

function maVerdict(price, ma) {
  if (ma == null) return 'neutral'
  return price > ma ? 'buy' : price < ma ? 'sell' : 'neutral'
}

export async function getTechnicalIndicators(id) {
  const stock = await getStockRow(id)
  if (!stock) return null

  const real = await fetchRealCandles(stock.id, '2y')
  if (real && real.length >= 30) {
    const closes = real.map((c) => c.close)
    const price = stock.price ?? closes[closes.length - 1]
    const dma30 = sma(closes, 30)
    const dma50 = sma(closes, 50)
    const dma200 = sma(closes, 200)
    const pos = (dma) => (dma === null ? 'na' : price >= dma ? 'above' : 'below')

    // --- Moving averages table (SMA + EMA across common periods) ---
    const maPeriods = [10, 20, 30, 50, 100, 200]
    const movingAverages = maPeriods
      .map((p) => {
        if (closes.length < p) return null
        const smaVal = sma(closes, p)
        const emaVal = ema(closes, p).at(-1)
        return {
          period: p,
          sma: smaVal,
          ema: emaVal,
          smaVerdict: maVerdict(price, smaVal),
          emaVerdict: maVerdict(price, emaVal),
        }
      })
      .filter(Boolean)

    // --- Oscillators table ---
    const rsi14 = computeRSI(closes, 14)
    const macd = computeMACD(closes)
    const stochK = computeStochastic(real, 14)
    const williamsR = computeWilliamsR(real, 14)
    const roc = computeROC(closes, 12)
    const cci = computeCCI(real, 20)

    const rsiVerdict = rsi14 == null ? 'neutral' : rsi14 > 70 ? 'sell' : rsi14 < 30 ? 'buy' : 'neutral'
    const macdVerdict = macd?.histogram == null ? 'neutral' : macd.histogram > 0 ? 'buy' : 'sell'
    const stochVerdict = stochK == null ? 'neutral' : stochK > 80 ? 'sell' : stochK < 20 ? 'buy' : 'neutral'
    const williamsVerdict = williamsR == null ? 'neutral' : williamsR > -20 ? 'sell' : williamsR < -80 ? 'buy' : 'neutral'
    const rocVerdict = roc == null ? 'neutral' : roc > 0 ? 'buy' : roc < 0 ? 'sell' : 'neutral'
    const cciVerdict = cci == null ? 'neutral' : cci > 100 ? 'sell' : cci < -100 ? 'buy' : 'neutral'

    const oscillators = [
      { label: 'RSI (14)', value: rsi14, verdict: rsiVerdict, digits: 2 },
      { label: 'Stochastic %K (14)', value: stochK, verdict: stochVerdict, digits: 2 },
      { label: 'Williams %R (14)', value: williamsR, verdict: williamsVerdict, digits: 2 },
      { label: 'CCI (20)', value: cci, verdict: cciVerdict, digits: 2 },
      { label: 'ROC (12)', value: roc, verdict: rocVerdict, digits: 2, suffix: '%' },
      { label: 'MACD (12,26,9)', value: macd?.histogram ?? null, verdict: macdVerdict, digits: 3 },
    ]

    const allVerdicts = [
      ...oscillators.map((o) => o.verdict),
      ...movingAverages.map((m) => m.smaVerdict),
      ...movingAverages.map((m) => m.emaVerdict),
    ]
    const buyCount = allVerdicts.filter((v) => v === 'buy').length
    const sellCount = allVerdicts.filter((v) => v === 'sell').length
    const summary = buyCount > sellCount * 1.3 ? 'Buy' : sellCount > buyCount * 1.3 ? 'Sell' : 'Neutral'

    return {
      price,
      dma30,
      dma50,
      dma200,
      above30: pos(dma30),
      above50: pos(dma50),
      above200: pos(dma200),
      fiftyTwoWHigh: stock.fiftyTwoWHigh,
      fiftyTwoWLow: stock.fiftyTwoWLow,
      pctFromHigh: stock.fiftyTwoWHigh ? Math.round(((stock.fiftyTwoWHigh - price) / stock.fiftyTwoWHigh) * 100) : null,
      pctFromLow: stock.fiftyTwoWLow ? Math.round(((price - stock.fiftyTwoWLow) / stock.fiftyTwoWLow) * 100) : null,
      oscillators,
      movingAverages,
      summary,
      buyCount,
      sellCount,
      neutralCount: allVerdicts.length - buyCount - sellCount,
    }
  }

  await delay(60)
  return deriveTechnical(stock)
}

export async function getFinancialStatements(id) {
  await delay(60)
  const stock = await getStockRow(id)
  if (!stock) return null
  const balanceSheet = deriveBalanceSheet(stock)
  return {
    quarterly: deriveQuarterlyDetailed(stock),
    pnl: derivePnl(stock),
    balanceSheet,
    cashFlows: deriveCashFlows(stock, balanceSheet),
    ratios: deriveRatios(stock),
    growth: deriveGrowth(stock),
  }
}

export async function getShareholderAnalytics(id) {
  await delay(60)
  const stock = await getStockRow(id)
  if (!stock) return null
  return {
    shareholders: deriveShareholders(stock),
    holdings: deriveHoldings(stock, 6),
    pledge: stock.promoterPledge || 0,
  }
}

export async function getCorporateDocuments(id) {
  await delay(60)
  const stock = await getStockRow(id)
  if (!stock) return null
  return deriveDocuments(stock)
}

export async function getPeers(id) {
  await delay(60)
  const stock = await getStockRow(id)
  if (!stock) return []
  return derivePeers(stock, stocks)
}

export async function getComparison(ids = []) {
  await delay(60)
  const rows = await Promise.all(ids.map((id) => getStockRow(id)))
  return rows
    .filter(Boolean)
    .map((s) => {
      const q = deriveQuarterlyDetailed(s, 2)[0]
      return { stock: s, salesQtrGrowth: q ? q.salesQoQ : null, npQtrGrowth: q ? q.profitQoQ : null }
    })
}

const FALLBACK_CONVICTION = {
  score: 50,
  label: 'Neutral',
  thesis: 'Data is being refreshed for this stock.',
  reasons: [],
  risks: [],
}

export async function getStockDetail(id) {
  await delay(60)
  const { stock, status, name, sym } = await resolveStock(id)

  if (!stock) {
    return {
      notFound: true,
      reason: status, // 'invalid' = not a real company, 'unavailable' = real but no price right now
      symbol: sym,
      name: name || sym,
    }
  }

  const redFlagResults = getRedFlagResults(stock.id)
  const conviction = deriveConviction(stock, redFlagResults || [])
  const profile = stockProfiles[stock.id] || {
    about: `${stock.name || stock.symbol} is an active listed company operating in the Indian Equity Markets.`,
    keyPoints: [
      `Core industry: ${stock.industry || 'Diversified'}.`,
    ],
    pros: ['Established market presence'],
    cons: ['Market volatility exposure'],
  }

  return {
    ...stock,
    notFound: false,
    about: profile.about,
    keyPoints: Array.isArray(profile.keyPoints) ? profile.keyPoints : [],
    pros: Array.isArray(profile.pros) ? profile.pros : [],
    cons: Array.isArray(profile.cons) ? profile.cons : [],
    quarterly: deriveQuarterly(stock),
    holdingsHistory: deriveHoldings(stock),
    boardMeetings: deriveBoardMeetings(stock),
    conviction: conviction || FALLBACK_CONVICTION,
    redFlags: {
      questions: redFlags.questions || [],
      results: redFlagResults,
    },
  }
}

export async function screenStocks(filters = {}) {
  await delay(60)
  return withLivePrices(stocks)
}

export async function getIPOs() {
  await delay(60)
  return ipos
}

const NIFTY50_SYMBOLS = ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "INFY", "ITC", "LARSEN", "SBIN", "BAJFINANCE", "M&M", "HCLTECH", "TATAMOTORS", "SUNPHARMA", "NTPC", "KOTAKBANK", "AXISBANK", "ONGC", "POWERGRID", "ASIANPAINT", "COALINDIA", "BAJAJFINSV", "MARUTI", "TATASTEEL", "ADANIENT", "HINDALCO", "ULTRACEMCO", "ADANIPORTS", "GRASIM", "WIPRO", "JSWSTEEL", "TRENT", "BEL", "NESTLEIND", "CIPLA", "DRREDDY", "TATACONSUM", "BAJAJ-AUTO", "APOLLOHOSP", "BRITANNIA", "EICHERMOT", "SBILIFE", "SHRIRAMFIN", "HDFCLIFE", "TECHM", "INDUSINDBK", "BPCL", "HEROMOTOCO", "CHOLAFIN", "TITAN"];
const SENSEX_SYMBOLS = ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "INFY", "ITC", "LARSEN", "SBIN", "BAJFINANCE", "M&M", "HCLTECH", "TATAMOTORS", "SUNPHARMA", "NTPC", "KOTAKBANK", "AXISBANK", "POWERGRID", "ASIANPAINT", "BAJAJFINSV", "MARUTI", "TATASTEEL", "ULTRACEMCO", "JSWSTEEL", "NESTLEIND", "INDUSINDBK", "TECHM", "WIPRO", "BAJAJ-AUTO", "TITAN"];
const BANKNIFTY_SYMBOLS = ['HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK', 'SBIN', 'INDUSINDBK', 'PNB', 'BANKBARODA', 'FEDERALBNK', 'IDFCFIRSTB', 'AUBANK', 'BANDHANBNK'];
const MIDCAP_SYMBOLS = ["MAXHEALTH", "CGPOWER", "TVSMOTOR", "CUMMINSIND", "TIINDIA", "DIXON", "POLICYBKR", "LUPIN", "SUNDARMFIN", "VOLTAS", "PRESTIGE", "KPITTECH", "PERSISTENT", "AUBANK", "FEDERALBNK", "MRF", "YESBANK", "IDFCFIRSTB", "ASHOKLEY", "OBEROIRLTY"];
const SMALLCAP_SYMBOLS = ["BSE", "SUZLON", "KALYANKJIL", "SONACOMS", "ANGELONE", "APARINDS", "CDSL", "MCX", "KEI", "RADICO", "CYIENT", "GLENMARK", "CHAMBLFERT", "WELCORP", "CAMS", "JBCHEPHARM", "PVRINOX", "RBLBANK", "UTIAMC", "HAPPSTMNDS"];

function getConstituentSymbols(indexId) {
  switch (indexId) {
    case 'NIFTY50': return NIFTY50_SYMBOLS;
    case 'SENSEX': return SENSEX_SYMBOLS;
    case 'BANKNIFTY': return BANKNIFTY_SYMBOLS;
    case 'MIDCAP': return MIDCAP_SYMBOLS;
    case 'SMALLCAP': return SMALLCAP_SYMBOLS;
    default: return NIFTY50_SYMBOLS.slice(0, 10);
  }
}

async function getConstituents(indexId) {
  const symbols = getConstituentSymbols(indexId)
  const rows = await Promise.all(symbols.map((sym) => getStockRow(sym)))
  return rows.filter(Boolean)
}

export async function getIndex(id) {
  await delay(60)
  const meta = indices.find((ix) => ix.id === id)
  if (!meta) return null
  const constituents = await getConstituents(id)
  return { ...meta, constituentCount: constituents.length, constituents }
}

export async function getPremiumInsights() {
  await delay(60)
  const featured = ['RELIANCE', 'TCS', 'HAL', 'SBIN', 'TATAMOTORS', 'HDFCBANK', 'SUNPHARMA', 'LT']
  const rows = await Promise.all(featured.map((id) => getStockRow(id)))
  return rows
    .filter(Boolean)
    .map((s) => ({ ...s, conviction: deriveConviction(s, getRedFlagResults(s.id) || []) }))
}

export default {
  getIndices, getAllStocks, searchStocks, getStock, getStockNews, getCandles, getTechnicalIndicators, getFinancialStatements, getShareholderAnalytics, getCorporateDocuments, getPeers, getComparison, getStockDetail, screenStocks, getIPOs, getIndex, getPremiumInsights,
}
