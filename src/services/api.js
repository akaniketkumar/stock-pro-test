import stocks from '../data/stocks.json'
import indices from '../data/indices.json'
import ipos from '../data/ipos.json'
import news from '../data/news.json'
import redFlags from '../data/redFlags.json'
import stockDetails from '../data/stockDetails.json'
import stockProfiles from '../data/stockProfiles.json'

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
const API_LATENCY = 80

function delay(ms = API_LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getStockRow(id) {
  if (!id) return null
  const sym = id.toUpperCase().replace('.NS', '').replace('.BO', '').replace(/\s+/g, '')
  return stocks.find((s) => s.id === sym || s.symbol === sym) || null
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

// 🔍 Search: sirf real stocks suggest karega, synthetic generator band
export async function searchStocks(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []

  const localMatches = stocks.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  )

  let combined = [...localMatches]

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

        for (const item of apiMatches) {
          if (!combined.some(c => c.symbol.toUpperCase() === item.symbol.toUpperCase())) {
            combined.push(item)
          }
        }
      }
    } catch {
      // fallback silent
    }
  }

  return combined.slice(0, 8)
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
  const stock = getStockRow(id)
  if (!stock) return []
  return deriveCandles(stock)
}

export async function getTechnicalIndicators(id) {
  await delay(60)
  const stock = getStockRow(id)
  if (!stock) return null
  return deriveTechnical(stock)
}

export async function getFinancialStatements(id) {
  await delay(60)
  const stock = getStockRow(id)
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
  const stock = getStockRow(id)
  if (!stock) return null
  return {
    shareholders: deriveShareholders(stock),
    holdings: deriveHoldings(stock, 6),
    pledge: stock.promoterPledge || 0,
  }
}

export async function getCorporateDocuments(id) {
  await delay(60)
  const stock = getStockRow(id)
  if (!stock) return null
  return deriveDocuments(stock)
}

export async function getPeers(id) {
  await delay(60)
  const stock = getStockRow(id)
  if (!stock) return []
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
  await delay(60)
  const cleanSym = (id || '').toUpperCase().replace('.NS', '').replace('.BO', '').replace(/\s+/g, '')
  let stock = getStockRow(cleanSym)

  // Agar local database mein nahi mila aur FMP key hai, toh live check karo
  if (!stock && FMP_KEY) {
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/profile/${cleanSym}.NS?apikey=${FMP_KEY}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0]
        stock = {
          id: cleanSym,
          symbol: cleanSym,
          name: item.companyName || cleanSym,
          sector: item.sector || 'Equity',
          industry: item.industry || 'Diversified',
          price: item.price || 0,
          change: item.changes || 0,
          changePct: 0,
          marketCap: item.mktCap ? item.mktCap / 10000000 : 0,
          pe: 20,
          pb: 2,
          roe: 15,
          roce: 18,
          debtToEquity: 0.5,
          freeCashFlow: 100,
          netProfit: 200,
          revenueGrowth: 10,
          profitGrowth: 10,
          fiftyTwoWHigh: item.range ? parseFloat(item.range.split('-')[1]) : item.price,
          fiftyTwoWLow: item.range ? parseFloat(item.range.split('-')[0]) : item.price,
          volume: item.volAvg || 100000,
          turnover: 50,
          promoterHolding: 50,
          fiiHolding: 15,
          diiHolding: 15,
          publicHolding: 20,
          promoterPledge: 0,
          rating: 'HOLD'
        }
      }
    } catch {
      // ignore
    }
  }

  // Agar stock bilkul exist nahi karta toh null return karo (fake data mat banao)
  if (!stock) return null

  const redFlagResults = getRedFlagResults(cleanSym)
  const conviction = safe(() => deriveConviction(stock, redFlagResults || []), FALLBACK_CONVICTION)
  const profile = stockProfiles[cleanSym] || {
    about: `${stock.name || stock.symbol} is an active listed company operating in the Indian Equity Markets.`,
    keyPoints: [
      `Market cap segment suggests active institutional and retail participation.`,
      `Core industry: ${stock.industry || 'Diversified'}.`,
      `Trading at P/E of ${stock.pe || '—'} with RoE of ${stock.roe || '—'}%.`,
    ],
    pros: ['Established market presence', 'Consistent operational performance', 'Regulatory compliant'],
    cons: ['Subject to macroeconomic conditions', 'Market volatility exposure'],
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
}

export async function screenStocks(filters = {}) {
  await delay(60)
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

// EXACT CONSTITUENTS
const NIFTY50_SYMBOLS = ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "INFY", "ITC", "LARSEN", "SBIN", "BAJFINANCE", "M&M", "HCLTECH", "TATAMOTORS", "SUNPHARMA", "NTPC", "KOTAKBANK", "AXISBANK", "ONGC", "POWERGRID", "ASIANPAINT", "COALINDIA", "BAJAJFINSV", "MARUTI", "TATASTEEL", "ADANIENT", "HINDALCO", "ULTRACEMCO", "ADANIPORTS", "GRASIM", "WIPRO", "JSWSTEEL", "TRENT", "BEL", "NESTLEIND", "CIPLA", "DRREDDY", "TATACONSUM", "BAJAJ-AUTO", "APOLLOHOSP", "BRITANNIA", "EICHERMOT", "SBILIFE", "SHRIRAMFIN", "HDFCLIFE", "TECHM", "INDUSINDBK", "BPCL", "HEROMOTOCO", "CHOLAFIN", "TITAN"];

const SENSEX_SYMBOLS = ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "INFY", "ITC", "LARSEN", "SBIN", "BAJFINANCE", "M&M", "HCLTECH", "TATAMOTORS", "SUNPHARMA", "NTPC", "KOTAKBANK", "AXISBANK", "POWERGRID", "ASIANPAINT", "BAJAJFINSV", "MARUTI", "TATASTEEL", "ULTRACEMCO", "JSWSTEEL", "NESTLEIND", "INDUSINDBK", "TECHM", "WIPRO", "BAJAJ-AUTO", "TITAN"];

const BANKNIFTY_SYMBOLS = ['HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK', 'SBIN', 'INDUSINDBK', 'PNB', 'BANKBARODA', 'FEDERALBNK', 'IDFCFIRSTB', 'AUBANK', 'BANDHANBNK'];

const MIDCAP_SYMBOLS = ["MAXHEALTH", "CGPOWER", "TVSMOTOR", "CUMMINSIND", "TIINDIA", "DIXON", "POLICYBKR", "LUPIN", "SUNDARMFIN", "VOLTAS", "PRESTIGE", "KPITTECH", "PERSISTENT", "AUBANK", "FEDERALBNK", "MRF", "YESBANK", "IDFCFIRSTB", "ASHOKLEY", "OBEROIRLTY"];

const SMALLCAP_SYMBOLS = ["BSE", "SUZLON", "KALYANKJIL", "SONACOMS", "ANGELONE", "APARINDS", "CDSL", "MCX", "KEI", "RADICO", "CYIENT", "GLENMARK", "CHAMBLFERT", "WELCORP", "CAMS", "JBCHEPHARM", "PVRINOX", "RBLBANK", "UTIAMC", "HAPPSTMNDS"];

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
  return symbols.map(sym => getStockRow(sym)).filter(Boolean)
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
