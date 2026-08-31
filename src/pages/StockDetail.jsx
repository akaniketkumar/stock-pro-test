import { Component, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getStockDetail,
  getCandles,
  getTechnicalIndicators,
  getFinancialStatements,
  getShareholderAnalytics,
  getCorporateDocuments,
} from '../services/api'
import StockHeader from '../components/stock/StockHeader'
import CompanyOverview from '../components/stock/CompanyOverview'
import ProsCons from '../components/stock/ProsCons'
import TechnicalIndicators from '../components/stock/TechnicalIndicators'
import FinancialStatements from '../components/stock/FinancialStatements'
import PeerComparison from '../components/stock/PeerComparison'
import ShareholderAnalytics from '../components/stock/ShareholderAnalytics'
import CorporateDocuments from '../components/stock/CorporateDocuments'
import NewsFeed from '../components/stock/NewsFeed'
import FinancialOverview from '../components/stock/FinancialOverview'
import ShareholdingSection from '../components/stock/ShareholdingSection'
import QuarterlySection from '../components/stock/QuarterlySection'
import BoardMeetings from '../components/stock/BoardMeetings'
import RedFlagAnalyzer from '../components/stock/RedFlagAnalyzer'
import ConvictionMeter from '../components/charts/ConvictionMeter'
import CandleChart from '../components/charts/CandleChart'
import LockedOverlay from '../components/ui/LockedOverlay'
import SectionTitle, { PremiumBadge } from '../components/ui/SectionTitle'
import { Skeleton } from '../components/ui/Loading'
import { useApp } from '../context/AppContext'

// 🛡️ GOD MODE: Auto-Heal Shield
// Agar kisi bhi stock ka koi ek hissa fail hota hai, toh ye poore page ko crash nahi hone dega.
class AutoHeal extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[120px] w-full items-center justify-center rounded-xl border border-slate-800/50 bg-slate-800/10 p-4 text-xs font-medium text-slate-500">
          {this.props.name} data is currently updating...
        </div>
      )
    }
    return this.props.children
  }
}

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'technicals', label: 'Technicals' },
  { id: 'financials', label: 'Financials' },
  { id: 'peers', label: 'Peers' },
  { id: 'shareholders', label: 'Shareholders' },
  { id: 'documents', label: 'Documents' },
]

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card p-6"><Skeleton className="h-8 w-2/5" /><Skeleton className="mt-3 h-10 w-1/4" /></div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card h-96 lg:col-span-2"><Skeleton className="m-4 h-full" /></div>
        <div className="card p-4"><Skeleton className="h-4 w-1/3" /></div>
      </div>
    </div>
  )
}

function SectionAnchor({ id, title, subtitle, children }) {
  return (
    <section id={id} className="card scroll-mt-28 p-5">
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function StockDetail() {
  const { id } = useParams() || { id: window.location.pathname.split('/').pop() }
  const { isPremium } = useApp()
  
  const [stock, setStock] = useState(null)
  const [candles, setCandles] = useState([])
  const [technical, setTechnical] = useState(null)
  const [financials, setFinancials] = useState(null)
  const [shareholders, setShareholders] = useState(null)
  const [documents, setDocuments] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getStockDetail(id).catch(() => ({})),
      getCandles(id).catch(() => []),
      getTechnicalIndicators(id).catch(() => null),
      getFinancialStatements(id).catch(() => null),
      getShareholderAnalytics(id).catch(() => null),
      getCorporateDocuments(id).catch(() => null),
    ])
      .then(([detail, candleData, tech, fin, sh, docs]) => {
        if (cancelled) return
        setStock(detail || { notFound: true, reason: 'invalid', symbol: id, name: id })
        setCandles(candleData || [])
        setTechnical(tech)
        setFinancials(fin)
        setShareholders(sh)
        setDocuments(docs)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  // Auto-refresh just the live price fields every 30s, and also the moment
  // the tab regains focus — so the price updates on its own instead of
  // needing a manual page reload.
  useEffect(() => {
    let cancelled = false
    function refreshPrice() {
      getStockDetail(id)
        .then((detail) => {
          if (cancelled || !detail) return
          setStock((prev) => (prev ? { ...prev, ...detail, quarterly: prev.quarterly, boardMeetings: prev.boardMeetings } : prev))
        })
        .catch(() => {})
    }
    const interval = setInterval(refreshPrice, 30000)
    function onVisible() {
      if (document.visibilityState === 'visible') refreshPrice()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [id])

  if (loading) return <PageSkeleton />

  // Real company check: don't render a stock page for a name that doesn't exist,
  // and don't fake numbers when a real company's live price couldn't be fetched.
  if (stock.notFound) {
    const isInvalid = stock.reason !== 'unavailable'
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="rounded-full bg-slate-800/60 p-4">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-100">
          {isInvalid ? `"${stock.symbol}" isn't a listed company` : `Live data unavailable for ${stock.name}`}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          {isInvalid
            ? "We couldn't find this symbol on NSE/BSE. Check the spelling or search for the company by name."
            : "This is a real company, but we couldn't fetch a live price right now. Please try again in a moment."}
        </p>
        <div className="mt-6 flex gap-3">
          <a href="/" className="btn-primary">Back to Home</a>
          <a href="/screener" className="btn-ghost">Open Screener</a>
        </div>
      </div>
    )
  }

  // 🧹 DATA SANITIZER: Kachra aur missing IDs ko yahi saaf kar do taaki andar crash na ho
  const safeQuarterly = Array.isArray(stock.quarterly) ? stock.quarterly.filter(q => q && q.id) : []
  const safeMeetings = Array.isArray(stock.boardMeetings) ? stock.boardMeetings.filter(b => b && b.id) : []
  const safeConviction = stock.conviction || { score: 50, label: 'Neutral', thesis: 'AI Data is currently being generated for this stock.', reasons: [], risks: [] }
  const safeRedFlags = stock.redFlags || { questions: [], results: [] }
  
  // Cleaned Stock Object
  const safeStock = { ...stock, quarterly: safeQuarterly, boardMeetings: safeMeetings }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      
      <AutoHeal name="Header">
        <div className="card p-6"><StockHeader stock={safeStock} /></div>
      </AutoHeal>

      <nav className="sticky top-16 z-30 -mx-1 rounded-xl border border-slate-800 bg-terminal-900/90 px-2 py-2 backdrop-blur">
        <div className="flex flex-wrap gap-1">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-terminal-800 hover:text-slate-100">
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      <SectionAnchor id="overview" title="Company Overview" subtitle={`Business profile, key highlights, strengths and risks for ${safeStock.symbol}`}>
        <AutoHeal name="Overview"><CompanyOverview stock={safeStock} /></AutoHeal>
        <div className="mt-6"><AutoHeal name="Pros & Cons"><ProsCons stock={safeStock} /></AutoHeal></div>
      </SectionAnchor>

      {/* 🚀 PRO CHART SECTION: Full Width & Extended Height */}
      <div className="space-y-6">
        <div className="card overflow-hidden p-4">
          <SectionTitle title="Price Chart" subtitle="Real daily candles from NSE, with volume and SMA 20/50" />
          <div className="mt-4 w-full">
            <AutoHeal name="Chart">
              {candles && candles.length > 0 ? (
                <CandleChart candles={candles} height={520} />
              ) : (
                <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-800/20 text-sm text-slate-500">Chart data updating...</div>
              )}
            </AutoHeal>
          </div>
        </div>

        <div className="card p-4">
          <SectionTitle title="Live News Feed" subtitle="AI-tagged by market impact" />
          <AutoHeal name="News Feed">
            <NewsFeed stockId={safeStock.id} />
          </AutoHeal>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-4">
          <SectionTitle title="Financial Overview" subtitle="Key valuation & profitability metrics" />
          <AutoHeal name="Financial Overview"><FinancialOverview stock={safeStock} /></AutoHeal>
        </div>

        <div className="card p-4">
          <SectionTitle title="Shareholding Pattern" subtitle="Promoters, FII, DII and public with pledge tracking · modeled estimate, not from live exchange filings" />
          <AutoHeal name="Shareholding"><ShareholdingSection stock={safeStock} /></AutoHeal>
        </div>
      </div>

      <SectionAnchor id="technicals" title="Technical Indicators" subtitle="Moving averages and momentum signals">
        <AutoHeal name="Technicals">
          {technical ? <TechnicalIndicators technical={technical} stock={safeStock} /> : <div className="mt-4 p-8 text-center text-sm text-slate-500">Technical data updating...</div>}
        </AutoHeal>
      </SectionAnchor>

      <SectionAnchor id="financials" title="Financial Statements" subtitle="Quarterly results, multi-year P&L, balance sheet, cash flows · modeled estimate, not official filings">
        <AutoHeal name="Financials">
          {financials ? <FinancialStatements data={financials} /> : <div className="mt-4 p-8 text-center text-sm text-slate-500">Financial statements compiling...</div>}
        </AutoHeal>
      </SectionAnchor>

      <SectionAnchor id="peers" title="Peer Comparison" subtitle={`Top peers in the sector`}>
        <AutoHeal name="Peer Comparison"><PeerComparison stock={safeStock} /></AutoHeal>
      </SectionAnchor>

      <SectionAnchor id="shareholders" title="Shareholder Analytics" subtitle="Investor base size, ownership trend and pledge risk">
        <AutoHeal name="Shareholder Analytics">
          {shareholders ? <ShareholderAnalytics stock={safeStock} data={shareholders} /> : <div className="mt-4 p-8 text-center text-sm text-slate-500">Analytics fetching...</div>}
        </AutoHeal>
      </SectionAnchor>

      <div className="card p-4">
        <SectionTitle title="Quarterly Results" subtitle="Latest four quarters of profit / loss performance · modeled estimate, not from official filings" />
        <AutoHeal name="Quarterly Results">
          {safeStock.quarterly && safeStock.quarterly.length > 0 ? <QuarterlySection stock={safeStock} /> : <div className="mt-4 p-8 text-center text-sm text-slate-500">Quarterly results updating...</div>}
        </AutoHeal>
      </div>

      <div className="card p-4">
        <SectionTitle title="Board Meetings & Corporate Actions" subtitle="Upcoming and recent board events" />
        <AutoHeal name="Board Meetings"><BoardMeetings meetings={safeStock.boardMeetings} /></AutoHeal>
      </div>

      <div className="card relative overflow-hidden p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <SectionTitle title="AI Stock Analyzer" subtitle="Nifty 50 AI conviction with deep logical reasoning" right={isPremium ? <PremiumBadge small /> : undefined} />
        </div>
        <LockedOverlay title="AI Stock Analyzer is a Premium Feature" subtitle="Unlock the AI Conviction Meter and the 16-Point Forensic Red Flag & Moat Analyzer." teaser="One-click subscription · Instant access">
          <div className="space-y-8">
            <AutoHeal name="AI Conviction"><div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-5"><ConvictionMeter conviction={safeConviction} /></div></AutoHeal>
            <AutoHeal name="Red Flags"><div className="p-1"><RedFlagAnalyzer redFlags={safeRedFlags} /></div></AutoHeal>
          </div>
        </LockedOverlay>
      </div>

    </div>
  )
}
