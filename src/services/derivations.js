import { seededRand } from '../utils/random'

const BANK_LIKE = new Set(['Banking', 'Financial Services'])

function quarterLabels(count) {
  const labels = []
  let year = 2026
  let month = 5
  for (let i = 0; i < count; i += 1) {
    const fy = month <= 2 ? year : year + 1
    const q = month <= 2 ? 4 : Math.floor((month - 3) / 3) + 1
    labels.push(`Q${q} FY${String(fy).slice(2)}`)
    month -= 3
    if (month < 0) {
      month += 12
      year -= 1
    }
  }
  return labels
}

function dateOffset(daysBack) {
  const d = new Date(Date.UTC(2026, 7, 11))
  d.setUTCDate(d.getUTCDate() - daysBack)
  return d.toISOString().slice(0, 10)
}

const SECTOR_INTENSITY = {
  'Oil & Gas': 2.2,
  Infrastructure: 2.4,
  Metals: 2.0,
  Telecom: 2.6,
  Automobile: 1.6,
  Energy: 2.2,
  'Information Technology': 0.35,
  'Financial Services': 0.25,
  Banking: 0.12,
  Healthcare: 0.8,
  'Consumer Staples': 0.7,
  'Consumer Services': 0.6,
  Defence: 1.4,
}

function assetIntensity(stock) {
  return SECTOR_INTENSITY[stock.sector] ?? 1.1
}

export function deriveCandles(stock, count = 120) {
  const rand = seededRand(`${stock.id}-c`)
  const hi = stock.fiftyTwoWHigh || stock.price * 1.15
  const lo = stock.fiftyTwoWLow || stock.price * 0.85
  const start = lo + (hi - lo) * (0.25 + rand() * 0.2)
  const driftTarget = (stock.price - start) / count
  let prevClose = start
  const candles = []
  const baseVolume = stock.volume || 1000000
  for (let i = 0; i < count; i += 1) {
    const shock = (rand() - 0.5) * 0.045
    const open = prevClose * (1 + (rand() - 0.5) * 0.012)
    let close = prevClose * (1 + driftTarget / Math.max(prevClose, 1) + shock)
    if (rand() < 0.06) close = close * (1 + (rand() - 0.5) * 0.12)
    const wick = (rand() - 0.5) * 0.03
    const high = Math.max(open, close) * (1 + Math.abs(wick))
    const low = Math.min(open, close) * (1 - Math.abs(wick) * 0.9)
    const volume = Math.round(baseVolume * (0.4 + rand() * 1.4) * (1 + Math.abs(close - open) / open))
    candles.push({
      date: dateOffset(count - 1 - i),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    })
    prevClose = close
  }
  const last = candles[candles.length - 1]
  if (last) last.close = stock.price
  return candles
}

function computeSMA(closes, period) {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  return Math.round((slice.reduce((a, b) => a + b, 0) / period) * 100) / 100
}

export function deriveTechnical(stock) {
  const candles = deriveCandles(stock, 260)
  const closes = candles.map((c) => c.close)
  const price = stock.price
  const dma30 = computeSMA(closes, 30)
  const dma50 = computeSMA(closes, 50)
  const dma200 = computeSMA(closes, 200)
  const pos = (dma) => (dma === null ? 'na' : price >= dma ? 'above' : 'below')
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
  }
}

export function deriveQuarterly(stock, periods = 4) {
  const rand = seededRand(`${stock.id}-q`)
  const g = (stock.revenueGrowth || 8) / 100
  const pg = (stock.profitGrowth || 8) / 100
  const labels = quarterLabels(periods)
  return labels.map((period, i) => {
    const backFactor = Math.pow(1 + g, (periods - 1 - i) / 4)
    const revenue = Math.round(((stock.revenue || 10000) / 4) * backFactor * (0.98 + rand() * 0.04))
    const profit = Math.round(
      ((stock.netProfit || 1000) / 4) * Math.pow(1 + pg, (periods - 1 - i) / 4) * (0.96 + rand() * 0.08)
    )
    return {
      period,
      revenue,
      netProfit: profit,
      margin: profit > 0 ? Math.round((profit / revenue) * 1000) / 10 : -Math.round((Math.abs(profit) / revenue) * 1000) / 10,
      qoQ: i === 0 ? Math.round(pg * 1000) / 10 : Math.round(((pg * 0.7 + rand() * 0.1) * 100) * 10) / 10,
    }
  })
}

export function deriveQuarterlyDetailed(stock, quarters = 8) {
  const rand = seededRand(`${stock.id}-qd`)
  const g = (stock.revenueGrowth || 8) / 100
  const pg = (stock.profitGrowth || 8) / 100
  const labels = quarterLabels(quarters)
  const annualRevenue = stock.revenue || 10000
  const annualProfit = stock.netProfit || 1000
  const shares = stock.eps > 0 ? annualProfit / stock.eps : 100
  return labels.map((period, i) => {
    const rev = (annualRevenue / 4) / Math.pow(1 + g, i / 4) * (0.985 + rand() * 0.03)
    const opm = Math.max(1.5, (stock.ebitdaMargin || 12) * 0.74 * (0.9 + rand() * 0.2))
    const op = (rev * opm) / 100
    const oi = op * (0.05 + rand() * 0.09)
    const profit = (annualProfit / 4) / Math.pow(1 + pg, i / 4) * (0.94 + rand() * 0.12)
    const eps = shares > 0 ? profit / shares : 0
    return {
      period,
      sales: Math.round(rev),
      expenses: Math.round(rev - op),
      operatingProfit: Math.round(op),
      opm: Math.round(opm * 10) / 10,
      otherIncome: Math.round(oi),
      netProfit: Math.round(profit),
      eps: Math.round(eps * 100) / 100,
      salesQoQ: Math.round(((Math.pow(1 + g, 0.25) - 1) * 100) * 10) / 10,
      profitQoQ: Math.round(((Math.pow(1 + pg, 0.25) - 1) * 100) * 10) / 10,
    }
  })
}

function deriveBorrowings(stock, shares) {
  const bookValue = stock.bookValue || 100
  const netWorth = shares * bookValue
  return netWorth * (stock.debtToEquity ?? 0.3)
}

export function derivePnl(stock) {
  const rand = seededRand(`${stock.id}-p`)
  const annualRevenue = stock.revenue || 10000
  const annualProfit = stock.netProfit || 1000
  const g = (stock.revenueGrowth || 8) / 100
  const pg = (stock.profitGrowth || 8) / 100
  const shares = stock.eps > 0 ? annualProfit / stock.eps : 100
  const borrowings = deriveBorrowings(stock, shares)
  const isBank = BANK_LIKE.has(stock.sector)

  const years = ['TTM', 'FY25', 'FY24', 'FY23', 'FY22']
  const rows = years.map((label, i) => {
    const back = i === 0 ? 1 : Math.pow(1 + g, i) * (0.96 + rand() * 0.08)
    const sales = annualRevenue / back
    const opm = Math.max(1.5, (stock.ebitdaMargin || 12) * 0.76 * (0.92 + rand() * 0.16))
    const op = (sales * opm) / 100
    const otherIncome = isBank ? sales * (0.06 + rand() * 0.05) : op * (0.06 + rand() * 0.08)
    const interest = isBank ? sales * (0.38 + rand() * 0.1) : borrowings * (0.075 + rand() * 0.025)
    const depreciation = Math.max(0, (stock.fixedAssets || sales * 1.2) * (0.045 + rand() * 0.04)) * (isBank ? 0.2 : 1)
    const pbt = op + otherIncome - interest - depreciation
    return { label, sales, op, opm, otherIncome, interest, depreciation, pbt }
  })

  const ttm = rows[0]
  const taxRate = ttm.pbt > 0 ? Math.max(0, Math.min(0.42, 1 - annualProfit / ttm.pbt)) : 0.25

  return rows.map((row, i) => {
    const profit = i === 0 ? annualProfit : row.pbt * (1 - taxRate)
    const profitBack = i === 0 ? 1 : Math.pow(1 + pg, i) * (0.95 + rand() * 0.1)
    const adjustedProfit = i === 0 ? annualProfit : Math.max(0, annualProfit / profitBack)
    const netProfit = i === 0 ? Math.round(annualProfit) : Math.round(adjustedProfit)
    return {
      year: row.label,
      sales: Math.round(row.sales),
      expenses: Math.round(row.sales - row.op),
      operatingProfit: Math.round(row.op),
      opm: Math.round(row.opm * 10) / 10,
      otherIncome: Math.round(row.otherIncome),
      interest: Math.round(row.interest),
      depreciation: Math.round(row.depreciation),
      pbt: Math.round(row.pbt),
      tax: Math.round(row.pbt * taxRate),
      netProfit,
      eps: shares > 0 ? Math.round((netProfit / shares) * 100) / 100 : 0,
    }
  })
}

export function deriveBalanceSheet(stock) {
  const rand = seededRand(`${stock.id}-b`)
  const annualRevenue = stock.revenue || 10000
  const annualProfit = stock.netProfit || 1000
  const shares = stock.eps > 0 ? annualProfit / stock.eps : 100
  const bookValue = stock.bookValue || 100
  const equityCapital = shares * 10
  const reserves = shares * bookValue - equityCapital
  const borrowings = deriveBorrowings(stock, shares)
  const isBank = BANK_LIKE.has(stock.sector)
  const intensity = assetIntensity(stock)
  const fixedAssets = annualRevenue * intensity * (0.9 + rand() * 0.4)
  const cwip = fixedAssets * (0.07 + rand() * 0.12)
  const investments = (stock.marketCap || annualRevenue) * (0.08 + rand() * 0.2)
  const currentAssets = isBank ? borrowings * 0.2 : annualRevenue * (0.5 + rand() * 0.5)
  const currentLiabilities = currentAssets / Math.max(stock.currentRatio || 1, 0.5)
  const otherAssets = fixedAssets * (0.05 + rand() * 0.08)
  return {
    equityCapital: Math.round(equityCapital),
    reserves: Math.round(reserves),
    netWorth: Math.round(equityCapital + reserves),
    borrowings: Math.round(borrowings),
    fixedAssets: Math.round(fixedAssets),
    cwip: Math.round(cwip),
    investments: Math.round(investments),
    currentAssets: Math.round(currentAssets),
    currentLiabilities: Math.round(currentLiabilities),
    otherAssets: Math.round(otherAssets),
  }
}

export function deriveCashFlows(stock, balanceSheet) {
  const rand = seededRand(`${stock.id}-cf`)
  const annualProfit = stock.netProfit || 1000
  const operating = stock.operatingCashFlow || Math.round(annualProfit * (0.9 + rand() * 0.4))
  const capex = (balanceSheet.fixedAssets || annualProfit * 5) * (0.16 + rand() * 0.12)
  const investing = -Math.round(capex)
  const netTarget = Math.round(annualProfit * (rand() * 0.12 - 0.02))
  const financing = Math.round(-operating - investing + netTarget)
  return {
    operating: Math.round(operating),
    investing,
    financing,
    netCashFlow: Math.round(operating + investing + financing),
  }
}

export function deriveRatios(stock) {
  const rand = seededRand(`${stock.id}-r`)
  const sector = stock.sector || ''
  let ranges
  if (sector === 'Information Technology') ranges = [50, 90, 1, 10, 20, 45]
  else if (BANK_LIKE.has(sector)) ranges = [10, 30, 1, 6, 10, 35]
  else if (sector === 'Consumer Staples' || sector === 'Consumer Services' || sector === 'Retail') ranges = [12, 38, 18, 60, 30, 80]
  else if (['Automobile', 'Infrastructure', 'Metals', 'Oil & Gas', 'Telecom', 'Defence'].includes(sector)) ranges = [28, 62, 25, 75, 40, 95]
  else ranges = [22, 55, 15, 55, 28, 70]
  const [dl, dh, il, ih, pl, ph] = ranges
  const debtorDays = Math.round(dl + rand() * (dh - dl))
  const inventoryDays = Math.round(il + rand() * (ih - il))
  const payableDays = Math.round(pl + rand() * (ph - pl))
  return {
    debtorDays,
    inventoryDays,
    payableDays,
    workingCapitalDays: debtorDays + inventoryDays - payableDays,
    roce: stock.roce ?? 0,
    debtToEquity: stock.debtToEquity ?? 0,
    currentRatio: stock.currentRatio ?? 1,
    ebitdaMargin: stock.ebitdaMargin ?? null,
  }
}

export function deriveGrowth(stock) {
  const rand = seededRand(`${stock.id}-g`)
  const g = (stock.revenueGrowth || 8) / 100
  const pg = (stock.profitGrowth || 8) / 100
  const salesGrowth10Y = Math.max(0.5, g * (0.55 + rand() * 0.8) * 100)
  const salesGrowth5Y = Math.max(0.5, g * (0.7 + rand() * 0.55) * 100)
  const salesGrowth3Y = Math.max(0.5, g * (0.85 + rand() * 0.4) * 100)
  const salesGrowthTTM = Math.max(-5, g * (0.9 + rand() * 0.25) * 100)

  const profitGrowth10Y = Math.max(-2, pg * (0.6 + rand() * 0.9) * 100)
  const profitGrowth5Y = Math.max(-2, pg * (0.72 + rand() * 0.6) * 100)
  const profitGrowth3Y = Math.max(-5, pg * (0.85 + rand() * 0.4) * 100)
  const profitGrowthTTM = Math.max(-10, pg * (0.9 + rand() * 0.25) * 100)

  const meanR = stock.rating === 'BUY' ? 0.13 : stock.rating === 'SELL' ? 0.02 : 0.08
  const yearlyReturns = Array.from({ length: 10 }, () => Math.max(-0.5, meanR * (0.4 + rand() * 1.3)))
  let factor = 1
  const series = [1]
  for (let i = 0; i < yearlyReturns.length; i += 1) {
    factor /= 1 + yearlyReturns[i]
    series.push(factor)
  }
  const cagr = (k) => ((Math.pow(1 / series[k], 1 / k) - 1) * 100).toFixed(1)
  const oneYAnchor = stock.fiftyTwoWLow ? (stock.price / (stock.fiftyTwoWLow * (0.95 + rand() * 0.15)) - 1) * 100 : cagr(1)

  const roe = stock.roe ?? 12
  const roe10Y = Math.round(Math.max(0, roe * (0.5 + rand() * 0.25)) * 10) / 10
  const roe5Y = Math.round(Math.max(0, roe * (0.62 + rand() * 0.25)) * 10) / 10
  const roe3Y = Math.round(Math.max(0, roe * (0.75 + rand() * 0.2)) * 10) / 10

  return {
    sales: [
      { label: '10Y', value: Math.round(salesGrowth10Y * 10) / 10, key: 'salesGrowth10Y' },
      { label: '5Y', value: Math.round(salesGrowth5Y * 10) / 10, key: 'salesGrowth5Y' },
      { label: '3Y', value: Math.round(salesGrowth3Y * 10) / 10, key: 'salesGrowth3Y' },
      { label: 'TTM', value: Math.round(salesGrowthTTM * 10) / 10, key: 'salesGrowthTTM' },
    ],
    profit: [
      { label: '10Y', value: Math.round(profitGrowth10Y * 10) / 10, key: 'profitGrowth10Y' },
      { label: '5Y', value: Math.round(profitGrowth5Y * 10) / 10, key: 'profitGrowth5Y' },
      { label: '3Y', value: Math.round(profitGrowth3Y * 10) / 10, key: 'profitGrowth3Y' },
      { label: 'TTM', value: Math.round(profitGrowthTTM * 10) / 10, key: 'profitGrowthTTM' },
    ],
    price: [
      { label: '10Y', value: Number(cagr(10)) },
      { label: '5Y', value: Number(cagr(5)) },
      { label: '3Y', value: Number(cagr(3)) },
      { label: '1Y', value: Math.round(oneYAnchor * 10) / 10 },
    ],
    roe: [
      { label: '10Y', value: roe10Y, key: 'roe10Y' },
      { label: '5Y', value: roe5Y, key: 'roe5Y' },
      { label: '3Y', value: roe3Y, key: 'roe3Y' },
      { label: 'Last Yr', value: Math.round(roe * 10) / 10, key: 'roeLastYear' },
    ],
  }
}

export function deriveHoldings(stock, periods = 4) {
  const rand = seededRand(`${stock.id}-h`)
  const labels = quarterLabels(periods)
  return labels.map((period, i) => {
    const drift = (n) => Math.round((n + (i - (periods - 1) / 2) * (rand() * 1.4 - 0.7)) * 10) / 10
    const promoters = Math.max(0, drift(stock.promoterHolding || 0))
    const fii = Math.max(0, drift(stock.fiiHolding || 0))
    const dii = Math.max(0, drift(stock.diiHolding || 0))
    const remaining = Math.max(0, 100 - promoters - fii - dii)
    return { period, promoters, fii, dii, publicHolding: Math.round(remaining * 10) / 10 }
  })
}

export function deriveShareholders(stock) {
  const rand = seededRand(`${stock.id}-sh`)
  const annualProfit = stock.netProfit || 1000
  const shares = stock.eps > 0 ? annualProfit / stock.eps : 100
  const publicHolding = stock.publicHolding || 20
  const base = Math.max(2, Math.min(60, Math.round((3 + shares * 0.22 + publicHolding * 0.5) * (0.8 + rand() * 0.4))))
  const labels = quarterLabels(6)
  const history = labels.map((period, i) => {
    const total = Math.max(1, Math.round(base * Math.pow(1 + (0.015 + rand() * 0.03), 5 - i)))
    const prev = Math.max(1, Math.round(base * Math.pow(1 + (0.015 + rand() * 0.03), 5 - i + 1)))
    const growth = Math.round(((total - prev) / prev) * 1000) / 10
    return { period, total, growth }
  })
  return { current: history[0], history }
}

export function deriveDocuments(stock) {
  const rand = seededRand(`${stock.id}-d`)
  const name = stock.name
  const announcements = [
    { date: '2026-08-06', title: `${name}: Quarterly Results & Board Meeting`, type: 'Results' },
    { date: '2026-07-28', title: `${name}: Board approves interim dividend of ₹2.50/share`, type: 'Dividend' },
    { date: '2026-07-14', title: `${name}: Analyst / Investor Meeting & Earnings Call`, type: 'Concall' },
    { date: '2026-06-24', title: `${name}: Credit rating reaffirmed by rating agencies`, type: 'Credit Rating' },
    { date: '2026-05-30', title: `${name}: Business update on subsidiary operations`, type: 'Subsidiary' },
    { date: '2026-05-09', title: `${name}: Board considers buyback proposal`, type: 'Buyback' },
    { date: '2026-04-18', title: `${name}: Shareholding pattern for quarter ended Mar 2026`, type: 'Shareholding' },
    { date: '2026-03-27', title: `${name}: SEBI / exchange clarification on media reports`, type: 'Clarification' },
  ]
  const annualReports = ['FY26', 'FY25', 'FY24', 'FY23', 'FY22'].map((year) => ({
    year,
    title: `${name} Annual Report ${year} (PDF)`,
    type: 'PDF',
  }))
  const agencies = ['ICRA', 'CRISIL', 'CARE Ratings', 'India Ratings']
  const ratings = agencies.map((agency, i) => ({
    agency,
    rating: rand() > 0.4 ? 'AAA' : 'AA+',
    outlook: rand() > 0.75 ? 'Stable' : 'Positive',
    date: `2026-0${i + 1}-${10 + Math.floor(rand() * 15)}`,
  }))
  const quarters = quarterLabels(4)
  const concalls = quarters.map((q, i) => ({
    quarter: q,
    date: dateOffset(i * 95 + 20),
    transcript: `${name} ${q} Earnings Call Transcript (PDF)`,
    audio: `${name} ${q} Earnings Call Audio`,
  }))
  return { announcements, annualReports, ratings, concalls }
}

export function derivePeers(stock, allStocks) {
  const peers = allStocks
    .filter((s) => s.sector === stock.sector && s.id !== stock.id)
    .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
    .slice(0, 9)
  return peers.map((s) => {
    const q = deriveQuarterlyDetailed(s, 2)[0]
    return {
      id: s.id,
      symbol: s.symbol,
      name: s.name,
      marketCap: s.marketCap,
      pe: s.pe,
      roce: s.roce,
      salesQtrGrowth: q ? q.salesQoQ : null,
      npQtrGrowth: q ? q.profitQoQ : null,
    }
  })
}
