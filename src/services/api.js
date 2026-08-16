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

// Vercel ke locker se FMP API Key yahan connect hogi
const FMP_KEY = import.meta.env.VITE_FMP_API_KEY
const API_LATENCY = 120

function getStockRow(id) {
  return stocks.find((s) => s.id === id) || null
}

function delay(ms = API_LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  const total = redFlagResults.length || 16
  const danger = redFlagResults.filter((r) => r.status === 'danger').length
  const watch = redFlagResults.filter((r) => r.status === 'watch').length
  const passCount = total - danger - watch
  const base = Math.round((passCount / total) * 70)
  const ratingBoost = stock.rating === 'BUY' ? 12 : stock.rating === 'HOLD' ? 2 : -12
  const score = Math.max(10, Math.min(90, base + ratingBoost))
  const label = score >= 75 ? 'Strong Bullish' : score >= 60 ? 'Bullish' : score >= 45 ? 'Neutral' : score >= 30 ? 'Bearish' : 'Strong Bearish'
  return {
    score,
    label,
    thesis: `Fundamental and technical analysis of ${stock.name} suggests a ${label.toLowerCase()} outlook based on current data.`,
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
  await delay()
  return stocks
}

export async function searchStocks(query) {
  await delay(80)
  const q = (query || '').trim().toLowerCase()
  if (!q) return []
  return stocks
    .filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    .slice(0, 8)
}

export async function getStock(id) {
  await delay()
  return getStockRow(id)
}

export async function getStockNews(id) {
  await delay(90)
  return news[id] || []
}

export async function getCandles(id) {
  await delay(140)
  try {
    const stock = getStockRow(id)
    if (!stock) return []
    return deriveCandles(stock)
  } catch {
    return []
  }
}

export async function getTechnicalIndicators(id) {
  await delay(120)
  try {
    const stock = getStockRow(id)
    if (!stock) return null
    return deriveTechnical(stock)
  } catch {
    return null
  }
}

export async function getFinancialStatements(id) {
  await delay(160)
  try {
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
  } catch {
    return null
  }
}

export async function getShareholderAnalytics(id) {
  await delay(120)
  try {
    const stock = getStockRow(id)
    if (!stock) return null
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
  await delay(120)
  try {
    const stock = getStockRow(id)
    if (!stock) return null
    return deriveDocuments(stock)
  } catch {
    return null
  }
}

export async function getPeers(id) {
  await delay(140)
  const stock = getStockRow(id)
  if (!stock) return []
  return derivePeers(stock, stocks)
}

export async function getComparison(ids = []) {
  await delay(120)
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
  await delay(150)
  try {
    let stock = getStockRow(id)
    if (!stock) return null

    // --- ASLI API SE LIVE DATA LAANE KA CODE ---
    if (FMP_KEY) {
      try {
        // NSE stocks ke aage .NS lagta hai FMP API me
        const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${id}.NS?apikey=${FMP_KEY}`)
        const data = await res.json()
        if (data && data.length > 0) {
          const live = data[0]
          stock = {
            ...stock,
            price: live.price,
            change: live.change,
            changePct: live.changesPercentage,
            marketCap: live.marketCap / 10000000, // Cr me convert kiya
            fiftyTwoWHigh: live.yearHigh,
            fiftyTwoWLow: live.yearLow,
            volume: live.volume
          }
        }
      } catch (e) {
        console.log("Live API failed, using fallback mock data")
      }
    }
    // ------------------------------------------

    const redFlagResults = getRedFlagResults(id)
    const conviction = safe(() => deriveConviction(stock, redFlagResults || []), FALLBACK_CONVICTION)
    const profile = stockProfiles[id] || {
      about: `${stock.name} operates in the ${stock.industry} space on the NSE.`,
      keyPoints: [
        `Listed on NSE with market cap of ₹${(stock.marketCap / 1000).toFixed(0)}K Cr.`,
        `Core business: ${stock.industry}.`,
        `Trading at P/E of ${stock.pe || '—'} with RoE of ${stock.roe || '—'}%.`,
      ],
      pros: ['Established business with a diversified base', 'Positive operating cash flow', 'No significant governance red flags'],
      cons: ['Sector cyclicality', 'Valuation offers limited margin of safety', 'Competitive intensity in the industry'],
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
        questions: redFlags.questions,
        results: redFlagResults,
      },
    }
  } catch {
    const stock = getStockRow(id) || {}
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
  await delay(140)
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
  await delay()
  return ipos
}

const BANK_SECTORS = new Set(['Banking', 'Financial Services'])

function getConstituents(indexId) {
  const ranked = [...stocks].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
  switch (indexId) {
    case 'NIFTY50':
      return ranked
    case 'SENSEX':
      return ranked.slice(0, 22)
    case 'BANKNIFTY':
      return ranked.filter((s) => BANK_SECTORS.has(s.sector))
    case 'MIDCAP':
      return ranked.slice(22)
    case 'SMALLCAP':
      return ranked.slice(22)
    default:
      return []
  }
}

export async function getIndex(id) {
  await delay(100)
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
  await delay(120)
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
