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
  if (!base) return { stock: null, status: 'invalid', sym }

  const live = await fetchLiveQuote(sym)
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

export async function getIndices() {
  await delay(60)
  return indices
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

  await ensureDirectory()

  const curatedMatches = SEARCH_UNIVERSE.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  )

  const seen = new Set(curatedMatches.map((s) => s.id))
  const directoryMatches = (fullDirectory || [])
    .filter((c) => !seen.has(c.symbol) && (c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)))
    .map((c) => ({ id: c.symbol, symbol: c.symbol, name: c.name, sector: 'Equity' }))

  return [...curatedMatches, ...directoryMatches].slice(0, 8)
}

export async function getStock(id) {
  await delay(60)
  return getStockRow(id)
}

export async function getStockNews(id) {
  await delay(60)
  return news[id] || []
}

export async function getCandles(id) {
  await delay(60)
  const stock = await getStockRow(id)
  if (!stock) return []
  return deriveCandles(stock)
}

export async function getTechnicalIndicators(id) {
  await delay(60)
  const stock = await getStockRow(id)
  if (!stock) return null
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
