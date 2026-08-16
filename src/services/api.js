import stocks from '../data/stocks.json'
import indices from '../data/indices.json'
import ipos from '../data/ipos.json'
import news from '../data/news.json'
import redFlags from '../data/redFlags.json'
import stockDetails from '../data/stockDetails.json'
import stockProfiles from '../data/stockProfiles.json'
import relianceDetail from '../data/relianceDetail.js'
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
import { seededRand } from '../utils/random'

const FMP_KEY = import.meta.env.VITE_FMP_API_KEY
const API_LATENCY = 100

function delay(ms = API_LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getStockRow(id) {
  const sym = (id || '').toUpperCase().replace('.NS', '').replace('.BO', '')
  const found = stocks.find((s) => s.id === sym || s.symbol === sym)
  if (found) return found

  return {
    id: sym,
    symbol: sym,
    name: sym,
    sector: 'Equity',
    industry: 'Diversified',
    price: 1000,
    change: 0,
    changePct: 0,
    marketCap: 50000,
    pe: 24.5,
    pb: 3.2,
    roe: 15.8,
    roce: 17.5,
    debtToEquity: 0.3,
    freeCashFlow: 450,
    netProfit: 950,
    revenueGrowth: 11.2,
    profitGrowth: 13.5,
    fiftyTwoWHigh: 1200,
    fiftyTwoWLow: 800,
    promoterHolding: 51.5,
    fiiHolding: 20.2,
    diiHolding: 14.8,
    publicHolding: 13.5,
    promoterPledge: 0,
    rating: 'BUY'
  }
}

function deriveBoardMeetings(stock) {
  const rand = seededRand(`${stock.id}-b`)
  const resultPeriods = ['14 Oct 2026', '25 Jul 2026', '25 Apr 2026', '22 Jan 2026']
  const meetings = resultPeriods.map((date, i) => ({
    id: `${stock.id}-bm-${i}`,
    date,
    purpose: i === 0 ? 'Q2 FY27 Results & Interim Dividend' : i === 1 ? 'Q1 FY27 Results' : i === 2 ? 'Q4 FY26 Results & Final Dividend' : 'Q3 FY26 Results',
    status: 'Held',
    link: 'bse-filings',
  }))
  meetings.push({
    id: `${stock.id}-bm-agm`,
    date: '05 Aug 2026',
    purpose: `Annual General Meeting (AGM)`,
    status: 'Held',
    link: 'bse-filings',
  })
  if (rand() > 0.5) {
    meetings.push({
      id: `${stock.id}-bm-bd`,
      date: '28 Oct 2026',
      purpose: 'Buyback / Open Market Purchase',
      status: 'Scheduled',
      link: 'bse-filings',
    })
  }
  return meetings
}

function deriveConviction(stock, redFlagResults) {
  const overrides = stockDetails[stock.id]?.conviction
  if (overrides) return overrides
  const total = (redFlagResults && redFlagResults.length) || 16
  const danger = (redFlagResults || []).filter((r) => r.status === 'danger').length
  const watch = (redFlagResults || []).filter((r) => r.status === 'watch').length
  const passCount = Math.max(0, total - danger - watch)
  const base = Math.round((passCount / (total || 16)) * 70)
  const ratingBoost = stock.rating === 'BUY' ? 12 : stock.rating === 'HOLD' ? 2 : -12
  const score = Math.max(10, Math.min(90, base + ratingBoost))
  const label = score >= 75 ? 'Strong Bullish' : score >= 60 ? 'Bullish' : score >= 45 ? 'Neutral' : score >= 30 ? 'Bearish' : 'Strong Bearish'
  return {
    score,
    label,
    thesis: `Fundamental and technical analysis of ${stock.name || stock.symbol} suggests a ${label.toLowerCase()} outlook.`,
    reasons: [
      `${passCount} of ${total} forensic checks passed; ${danger} critical red flags detected.`,
      `${stock.revenueGrowth || 0}% revenue growth with ${stock.profitGrowth || 0}% profit growth in the latest quarter.`,
      `RoCE at ${stock.roce || 0}% and RoE at ${stock.roe || 0}% ${
        (stock.roe || 0) > 15 ? 'indicate strong capital efficiency.' : 'suggest moderate capital efficiency.'
      }`,
      stock.freeCashFlow > 0
        ? 'Free cash flow is positive, supporting sustainable shareholder returns.'
        : 'Free cash flow is negative, a key liquidity concern.',
    ],
    risks: [
      'Sector cyclicality may alter the near-term earnings trajectory.',
      'Macro rates and liquidity conditions remain the dominant external variable.',
      'Re-rating depends on execution consistency across the next two quarters.',
    ],
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
  return stocks
}

// LIVE SEARCH: Local JSON + Live FMP API Search
export async function searchStocks(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []

  const localMatches = stocks.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  )

  if (FMP_KEY && localMatches.length < 5) {
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_KEY}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        const apiMatches = data
          .filter(item => item.currency === 'INR' || (item.exchangeShortName && ['NSE', 'BSE', 'INDEX'].includes(item.exchangeShortName)))
          .map(item => {
            const cleanSym = item.symbol.replace('.NS', '').replace('.BO', '')
            return {
              id: cleanSym,
              symbol: cleanSym,
              name: item.name || cleanSym,
              sector: 'Equity',
              price: item.price || 0,
              changePct: 0,
              marketCap: 0
            }
          })

        const combined = [...localMatches]
        for (const item of apiMatches) {
          if (!combined.some(c => c.symbol.toUpperCase() === item.symbol.toUpperCase())) {
            combined.push(item)
          }
        }
        return combined.slice(0, 8)
      }
    } catch (e) {
      console.warn("Live search fallback applied")
    }
  }

  return localMatches.slice(0, 8)
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
  await delay(80)
  try {
    const stock = getStockRow(id)
    return deriveCandles(stock)
  } catch {
    return []
  }
}

export async function getTechnicalIndicators(id) {
  await delay(60)
  try {
    const stock = getStockRow(id)
    return deriveTechnical(stock)
  } catch {
    return null
  }
}

export async function getFinancialStatements(id) {
  await delay(80)
  try {
    const stock = getStockRow(id)
    const balanceSheet = deriveBalanceSheet(stock)
    return {
      quarterly: deriveQuarterlyDetailed(stock),
      pnl: derivePnl(stock),
      balanceSheet,
      cashFlows: deriveCashFlows(stock, balanceSheet),
      ratios: deriveRatios(stock),
      growth: deriveGrowth(stock),
    }
  } catch {
    return null
  }
}

export async function getShareholderAnalytics(id) {
  await delay(60)
  try {
    const stock = getStockRow(id)
    return {
      shareholders: deriveShareholders(stock),
      holdings: deriveHoldings(stock, 6),
      pledge: stock.promoterPledge || 0,
    }
  } catch {
    return null
  }
}

export async function getCorporateDocuments(id) {
  await delay(60)
  try {
    const stock = getStockRow(id)
    return deriveDocuments(stock)
  } catch {
    return null
  }
}

export async function getPeers(id) {
  await delay(60)
  const stock = getStockRow(id)
  return derivePeers(stock, stocks)
}

export async function getComparison(ids = []) {
  await delay(60)
  return ids
    .map((id) => getStockRow(id))
    .filter(Boolean)
    .map((s) => {
      const q = deriveQuarterlyDetailed(s, 2)[0]
      return { stock: s, salesQtrGrowth: q ? q.salesQoQ : null, npQtrGrowth: q ? q.profitQoQ : null }
    })
}

function safe(fn, fallback) {
  try {
    return fn() ?? fallback
  } catch {
    return fallback
  }
}

const FALLBACK_CONVICTION = {
  score: 50,
  label: 'Neutral',
  thesis: 'Data is being refreshed for this stock.',
  reasons: [],
  risks: [],
}

export async function getStockDetail(id) {
  await delay(80)
  try {
    const cleanSym = (id || '').toUpperCase().replace('.NS', '').replace('.BO', '')
    let stock = getStockRow(cleanSym)

    // Real-time quote fetch from FMP
    if (FMP_KEY) {
      try {
        const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${cleanSym}.NS?apikey=${FMP_KEY}`)
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const live = data[0]
          stock = {
            ...stock,
            name: live.name || stock.name,
            price: live.price || stock.price,
            change: live.change || stock.change,
            changePct: live.changesPercentage || stock.changePct,
            marketCap: live.marketCap ? live.marketCap / 10000000 : stock.marketCap,
            fiftyTwoWHigh: live.yearHigh || stock.fiftyTwoWHigh,
            fiftyTwoWLow: live.yearLow || stock.fiftyTwoWLow,
            volume: live.volume || stock.volume
          }
        }
      } catch (e) {
        console.warn("FMP live quote failed, default applied")
      }
    }

    const redFlagResults = getRedFlagResults(cleanSym)
    const conviction = safe(() => deriveConviction(stock, redFlagResults || []), FALLBACK_CONVICTION)
    const profile = stockProfiles[cleanSym] || {
      about: `${stock.name || stock.symbol} is an active listed company in the Indian stock market (NSE/BSE).`,
      keyPoints: [
        `Listed on Indian Exchanges with market cap of ₹${((stock.marketCap || 50000) / 1000).toFixed(0)}K Cr.`,
        `Core industry: ${stock.industry || 'Market Leader'}.`,
        `Trading at P/E of ${stock.pe || '—'} with RoE of ${stock.roe || '—'}%.`,
      ],
      pros: ['Strong industry presence', 'Consistent cash flows', 'Clean corporate governance'],
      cons: ['Broader market volatility risk', 'Valuation premium sensitivity', 'Cyclical headwinds'],
    }

    return {
      ...stock,
      about: profile.about,
      keyPoints: Array.isArray(profile.keyPoints) ? profile.keyPoints : [],
      pros: Array.isArray(profile.pros) ? profile.pros : [],
      cons: Array.isArray(profile.cons) ? profile.cons : [],
      quarterly: safe(() => deriveQuarterly(stock), []),
      holdingsHistory: safe(() => deriveHoldings(stock), []),
      boardMeetings: safe(() => deriveBoardMeetings(stock), []),
      conviction: conviction || FALLBACK_CONVICTION,
      redFlags: {
        questions: redFlags.questions || [],
        results: redFlagResults,
      },
    }
  } catch {
    const stock = getStockRow(id)
    return {
      ...stock,
      about: '',
      keyPoints: [],
      pros: [],
      cons: [],
      quarterly: [],
      holdingsHistory: [],
      boardMeetings: [],
      conviction: FALLBACK_CONVICTION,
      redFlags: { questions: [], results: null },
    }
  }
}

export async function screenStocks(filters = {}) {
  await delay(80)
  const {
    maxPE,
    minMarketCap,
    minRoce,
    minRoe,
    maxDebtToEquity,
    minChangePct,
    maxChangePct,
    maxPledge,
    requirePositiveFCF,
    requirePositiveProfit,
    sectors,
    minPrice,
    maxPrice,
  } = filters
  return stocks.filter((s) => {
    if (maxPE !== null && maxPE !== undefined && s.pe !== null && s.pe !== undefined && s.pe > maxPE) return false
    if (minMarketCap && s.marketCap < minMarketCap) return false
    if (minRoce && (s.roce === null || s.roce === undefined || s.roce < minRoce)) return false
    if (minRoe && (s.roe === null || s.roe === undefined || s.roe < minRoe)) return false
    if (maxDebtToEquity !== null && maxDebtToEquity !== undefined && s.debtToEquity !== null && s.debtToEquity !== undefined && s.debtToEquity > maxDebtToEquity) return false
    if (minChangePct && s.changePct < minChangePct) return false
    if (maxChangePct && s.changePct > maxChangePct) return false
    if (maxPledge !== null && maxPledge !== undefined && (s.promoterPledge || 0) > maxPledge) return false
    if (requirePositiveFCF && (!s.freeCashFlow || s.freeCashFlow <= 0)) return false
    if (requirePositiveProfit && (!s.netProfit || s.netProfit <= 0)) return false
    if (sectors && sectors.length && !sectors.includes(s.sector)) return false
    if (minPrice && s.price < minPrice) return false
    if (maxPrice && s.price > maxPrice) return false
    return true
  })
}

export async function getIPOs() {
  await delay(60)
  return ipos
}

// ============================================
// 🔥 YAHAN HAIN ALL INDICES KI FULL LIVE LIST 🔥
// ============================================

const NIFTY50_SYMBOLS = ['RELIANCE','TCS','HDFCBANK','ICICIBANK','BHARTIARTL','SBIN','INFY','ITC','HINDUNILVR','LT','BAJFINANCE','HCLTECH','MARUTI','SUNPHARMA','TATAMOTORS','M&M','ASIANPAINT','ULTRACEMCO','TITAN','KOTAKBANK','NTPC','AXISBANK','ONGC','POWERGRID','COALINDIA','TATASTEEL','BAJAJFINSV','ADANIENT','ADANIPORTS','HINDALCO','WIPRO','GRASIM','TECHM','NESTLEIND','JSWSTEEL','CIPLA','SBILIFE','DRREDDY','BRITANNIA','EICHERMOT','DIVISLAB','APOLLOHOSP','BAJAJ-AUTO','TATACONSUM','HEROMOTOCO','HDFCLIFE','INDUSINDBK','UPL','BPCL','LTIM']

const SENSEX_SYMBOLS = ['RELIANCE','TCS','HDFCBANK','ICICIBANK','BHARTIARTL','SBIN','INFY','ITC','HINDUNILVR','LT','BAJFINANCE','HCLTECH','MARUTI','SUNPHARMA','TATAMOTORS','M&M','ASIANPAINT','ULTRACEMCO','TITAN','KOTAKBANK','NTPC','AXISBANK','POWERGRID','TATASTEEL','BAJAJFINSV','INDUSINDBK','NESTLEIND','TECHM','WIPRO','JSWSTEEL']

const BANKNIFTY_SYMBOLS = ['HDFCBANK','ICICIBANK','AXISBANK','KOTAKBANK','SBIN','INDUSINDBK','PNB','BANKBARODA','FEDERALBNK','IDFCFIRSTB','AUBANK','BANDHANBNK']

const MIDCAP_SYMBOLS = ['VBL','IREDA','SUZLON','YESBANK','NHPC','BHEL','IDEA','TRENT','LUPIN','PIIND','INDHOTEL','CUMMINSIND','OBEROIRLTY','ASTRAL','POLYCAB','DIXON','RECLTD','PFC','IRFC','RVNL']

const SMALLCAP_SYMBOLS = ['CDSL','BSE','IEX','MAZDOCK','COCHINSHIP','RAILTEL','IRCON','RITES','PAYTM','NYKAA','ZOMATO','ANGELONE','MCX','RENUKA','EASEMYTRIP','SUVENPHAR','CHALET','CEATLTD','LATENTVIEW','MAPMYINDIA']

function getConstituents(indexId) {
  let symbols = []
  switch (indexId) {
    case 'NIFTY50': symbols = NIFTY50_SYMBOLS; break;
    case 'SENSEX': symbols = SENSEX_SYMBOLS; break;
    case 'BANKNIFTY': symbols = BANKNIFTY_SYMBOLS; break;
    case 'MIDCAP': symbols = MIDCAP_SYMBOLS; break;
    case 'SMALLCAP': symbols = SMALLCAP_SYMBOLS; break;
    default: symbols = NIFTY50_SYMBOLS.slice(0, 10);
  }
  return symbols.map(sym => getStockRow(sym))
}

export async function getIndex(id) {
  await delay(60)
  const meta = indices.find((ix) => ix.id === id)
  if (!meta) return null
  const constituents = getConstituents(id)
  return {
    ...meta,
    constituentCount: constituents.length,
    constituents,
  }
}

export async function getPremiumInsights() {
  await delay(60)
  const featured = ['RELIANCE', 'TCS', 'HAL', 'SBIN', 'TATAMOTORS', 'HDFCBANK', 'SUNPHARMA', 'LT']
  return featured
    .map((id) => getStockRow(id))
    .filter(Boolean)
    .map((s) => ({
      ...s,
      conviction: deriveConviction(s, getRedFlagResults(s.id) || []),
    }))
}

export default {
  getIndices,
  getAllStocks,
  searchStocks,
  getStock,
  getStockNews,
  getCandles,
  getTechnicalIndicators,
  getFinancialStatements,
  getShareholderAnalytics,
  getCorporateDocuments,
  getPeers,
  getComparison,
  getStockDetail,
  screenStocks,
  getIPOs,
  getIndex,
  getPremiumInsights,
}
