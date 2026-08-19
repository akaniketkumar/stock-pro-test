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

// 🛠️ GENERATOR: Ye sirf tab chalega jab API confirm karegi ki stock asli hai
function generateSyntheticStats(sym, realName = null, realPrice = 0) {
  const hash = getHash(sym);
  const basePrice = realPrice > 0 ? realPrice : 50 + (hash % 4000); 
  const roe = 8 + (hash % 20);
  const changePct = ((hash % 40) - 20) / 10;
  const change = (basePrice * changePct) / 100;
  
  return {
    id: sym,
    symbol: sym,
    name: realName || sym,
    sector: 'Equity',
    industry: 'Diversified',
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePct: parseFloat(changePct.toFixed(2)),
    open: basePrice,
    dayHigh: basePrice * 1.02,
    dayLow: basePrice * 0.98,
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
    fiftyTwoWHigh: basePrice * 1.2,
    fiftyTwoWLow: basePrice * 0.8,
    promoterHolding: 50,
    fiiHolding: 15,
    diiHolding: 15,
    publicHolding: 20,
    promoterPledge: 0,
    rating: 'HOLD'
  }
}

function getStockRow(id) {
  if (!id) return null
  const sym = id.toUpperCase().replace('.NS', '').replace('.BO', '').replace(/\s+/g, '')
  const found = stocks.find((s) => s.id === sym || s.symbol === sym)
  if (found) return found
  
  // Local list mein nahi hai toh synthetic format do taaki UI load ho sake
  return generateSyntheticStats(sym)
}

// 🛑 PURE SEARCH ENGINE: Sirf Asli data, no fake blind words
export async function searchStocks(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []

  // 1. Local database search karo
  const localMatches = stocks.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  )

  let combined = [...localMatches]

  // 2. Agar API key hai, toh live server se check karo
  if (FMP_KEY) {
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_KEY}`)
      const data = await res.json()
      
      if (Array.isArray(data)) {
        // Sirf Indian (NSE/BSE) stocks ko filter karo
        const apiMatches = data
          .filter(item => item.currency === 'INR' || (item.exchangeShortName && ['NSE', 'BSE'].includes(item.exchangeShortName)))
          .map(item => {
            const cleanSym = item.symbol.replace('.NS', '').replace('.BO', '')
            // API se confirm ho gaya ki ye asli hai, ab iska data generate kardo
            return generateSyntheticStats(cleanSym, item.name, item.price)
          })

        for (const item of apiMatches) {
          if (!combined.some(c => c.symbol.toUpperCase() === item.symbol.toUpperCase())) {
            combined.push(item)
          }
        }
      }
    } catch {
      console.warn("Search API limit reached or failed.")
    }
  }

  // Yahan se purana "blind generator" poori tarah hata diya gaya hai!
  // Agar API ne kuch nahi diya aur local DB mein nahi hai, toh array khaali (empty) rahega.
  return combined.slice(0, 8)
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
  let stock = stocks.find((s) => s.id === cleanSym || s.symbol === cleanSym)

  // 🛑 PAGE LOAD ENGINE: Live verification 
  let isReal = !!stock

  if (!stock && FMP_KEY) {
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/profile/${cleanSym}.NS?apikey=${FMP_KEY}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0]
        isReal = true
        stock = {
          ...generateSyntheticStats(cleanSym, item.companyName, item.price),
          sector: item.sector || 'Equity',
          industry: item.industry || 'Diversified',
          marketCap: item.mktCap ? item.mktCap / 10000000 : 1000,
          volume: item.volAvg || 100000,
          fiftyTwoWHigh: item.range ? parseFloat(item.range.split('-')[1]) : item.price * 1.2,
          fiftyTwoWLow: item.range ? parseFloat(item.range.split('-')[0]) : item.price * 0.8,
        }
      }
    } catch {
      // API fail hui toh fail safe mode mein chalne do
    }
  }

  // Agar na local file mein mila, aur na hi FMP API ne ise asli maana, toh UFO dikhao!
  if (!isReal) return null

  const redFlagResults = getRedFlagResults(cleanSym) || []
  return {
    ...stock,
    about: `${stock.name || stock.symbol} is an active listed company operating in the Indian Equity Markets.`,
    keyPoints: [`Core industry: ${stock.industry || 'Diversified'}.`],
    pros: ['Established market presence'],
    cons: ['Market volatility exposure'],
    quarterly: deriveQuarterly(stock),
    holdingsHistory: deriveHoldings(stock),
    boardMeetings: [
      { id: `${stock.id}-bm-1`, date: '14 Oct 2026', purpose: 'Results', status: 'Held', link: '#' }
    ],
    conviction: FALLBACK_CONVICTION,
    redFlags: { questions: redFlags.questions || [], results: redFlagResults },
  }
}

// -------------------------------------------------------------
// Baaki Helpers (Unchanged)
// -------------------------------------------------------------
export async function getIndices() { await delay(60); return indices }
export async function getAllStocks() { await delay(60); return stocks }
export async function getStock(id) { await delay(60); return getStockRow(id) }
export async function getStockNews(id) { await delay(60); return news[id] || [] }
export async function getCandles(id) { await delay(60); const s = getStockRow(id); return s ? deriveCandles(s) : [] }
export async function getTechnicalIndicators(id) { await delay(60); const s = getStockRow(id); return s ? deriveTechnical(s) : null }
export async function getFinancialStatements(id) { await delay(60); const s = getStockRow(id); if(!s) return null; const b = deriveBalanceSheet(s); return { quarterly: deriveQuarterlyDetailed(s), pnl: derivePnl(s), balanceSheet: b, cashFlows: deriveCashFlows(s, b), ratios: deriveRatios(s), growth: deriveGrowth(s) } }
export async function getShareholderAnalytics(id) { await delay(60); const s = getStockRow(id); return s ? { shareholders: deriveShareholders(s), holdings: deriveHoldings(s, 6), pledge: s.promoterPledge || 0 } : null }
export async function getCorporateDocuments(id) { await delay(60); const s = getStockRow(id); return s ? deriveDocuments(s) : null }
export async function getPeers(id) { await delay(60); const s = getStockRow(id); return s ? derivePeers(s, stocks) : [] }
export async function getComparison(ids = []) { await delay(60); return ids.map(id => getStockRow(id)).filter(Boolean).map(s => { const q = deriveQuarterlyDetailed(s, 2)[0]; return { stock: s, salesQtrGrowth: q ? q.salesQoQ : null, npQtrGrowth: q ? q.profitQoQ : null } }) }
export async function screenStocks(filters = {}) { await delay(60); return stocks }
export async function getIPOs() { await delay(60); return ipos }

export async function getIndex(id) {
  await delay(60)
  const meta = indices.find((ix) => ix.id === id)
  if (!meta) return null
  const syms = id === 'SENSEX' ? ["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK"] : ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC"];
  const constituents = syms.map(sym => getStockRow(sym)).filter(Boolean)
  return { ...meta, constituentCount: constituents.length, constituents }
}
export async function getPremiumInsights() { await delay(60); return ['RELIANCE', 'TCS', 'HAL', 'SBIN'].map(id => getStockRow(id)).filter(Boolean).map(s => ({ ...s, conviction: FALLBACK_CONVICTION })) }

export default {
  getIndices, getAllStocks, searchStocks, getStock, getStockNews, getCandles, getTechnicalIndicators, getFinancialStatements, getShareholderAnalytics, getCorporateDocuments, getPeers, getComparison, getStockDetail, screenStocks, getIPOs, getIndex, getPremiumInsights,
}
