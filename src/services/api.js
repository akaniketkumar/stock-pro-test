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

function getHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

// 🛠️ FIX: Generator wapas chalu kar diya taaki saare 5000+ stocks chal sakein
function getStockRow(id) {
  if (!id) return null
  const sym = id.toUpperCase().replace('.NS', '').replace('.BO', '').replace(/\s+/g, '')
  const found = stocks.find((s) => s.id === sym || s.symbol === sym)
  if (found) return found

  const hash = getHash(sym);
  const price = 50 + (hash % 4000); 
  const roe = 8 + (hash % 20);
  
  const changePct = ((hash % 40) - 20) / 10;
  const change = (price * changePct) / 100;
  
  return {
    id: sym,
    symbol: sym,
    name: id.toUpperCase(),
    sector: 'Equity',
    industry: 'Diversified',
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePct: parseFloat(changePct.toFixed(2)),
    open: price,
    dayHigh: price * 1.02,
    dayLow: price * 0.98,
    volume: 50000 + (hash % 2000000),
    turnover: 50,
    marketCap: 1000 + (hash % 90000),
    pe: 12 + (hash % 40),
    pb: 1 + (hash % 8),
    roe: roe,
    roce: roe + 3.5,
    debtToEquity: 0.5,
    freeCashFlow: 100,
    netProfit: 200,
    revenueGrowth: 10,
    profitGrowth: 10,
    fiftyTwoWHigh: price * 1.2,
    fiftyTwoWLow: price * 0.8,
    promoterHolding: 50,
    fiiHolding: 15,
    diiHolding: 15,
    publicHolding: 20,
    promoterPledge: 0,
    rating: 'HOLD'
  }
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
  return stocks
}

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
      // ignore
    }
  }

  // 🛠️ FIX: Agar API block ho jaye, toh bhi user ka search chalna chahiye (Generator restored)
  if (combined.length === 0) {
    const cleanQuery = query.toUpperCase().trim()
    const syntheticSym = cleanQuery.replace(/\s+/g, '').substring(0, 10)
    const hashPrice = 50 + (getHash(syntheticSym) % 4000)
    
    combined.push({
      id: syntheticSym,
      symbol: syntheticSym,
      name: cleanQuery,
      sector: 'Equity',
      price: hashPrice,
      changePct: 0,
      marketCap: 1000 + (getHash(syntheticSym) % 90000)
    })
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
  return deriveCandles(stock)
}

export async function getTechnicalIndicators(id) {
  await delay(60)
  const stock = getStockRow(id)
  return deriveTechnical(stock)
}

export async function getFinancialStatements(id) {
  await delay(60)
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
}

export async function getShareholderAnalytics(id) {
  await delay(60)
  const stock = getStockRow(id)
  return {
    shareholders: deriveShareholders(stock),
    holdings: deriveHoldings(stock, 6),
    pledge: stock.promoterPledge || 0,
  }
}

export async function getCorporateDocuments(id) {
  await delay(60)
  const stock = getStockRow(id)
  return deriveDocuments(stock)
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

  const redFlagResults = getRedFlagResults(cleanSym)
  const conviction = deriveConviction(stock, redFlagResults || [])
  const profile = stockProfiles[cleanSym] || {
    about: `${stock.name || stock.symbol} is an active listed company operating in the Indian Equity Markets.`,
    keyPoints: [
      `Core industry: ${stock.industry || 'Diversified'}.`,
    ],
    pros: ['Established market presence'],
    cons: ['Market volatility exposure'],
  }

  return {
    ...stock,
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
  return stocks
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
  return { ...meta, constituentCount: constituents.length, constituents }
}

export async function getPremiumInsights() {
  await delay(60)
  const featured = ['RELIANCE', 'TCS', 'HAL', 'SBIN', 'TATAMOTORS', 'HDFCBANK', 'SUNPHARMA', 'LT']
  return featured.map((id) => getStockRow(id)).filter(Boolean).map((s) => ({ ...s, conviction: deriveConviction(s, getRedFlagResults(s.id) || []) }))
}

export default {
  getIndices, getAllStocks, searchStocks, getStock, getStockNews, getCandles, getTechnicalIndicators, getFinancialStatements, getShareholderAnalytics, getCorporateDocuments, getPeers, getComparison, getStockDetail, screenStocks, getIPOs, getIndex, getPremiumInsights,
}
