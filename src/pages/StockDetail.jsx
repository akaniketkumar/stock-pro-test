import { useEffect, useState } from 'react'
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
import TradingViewChart from '../components/charts/TradingViewChart'
import LockedOverlay from '../components/ui/LockedOverlay'
import SectionTitle, { PremiumBadge } from '../components/ui/SectionTitle'
import { Skeleton } from '../components/ui/Loading'
import { useApp } from '../context/AppContext'

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
      <div className="card p-6">
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="mt-3 h-10 w-1/4" />
        <div className="mt-5 grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card h-96 lg:col-span-2">
          <Skeleton className="m-4 h-full" />
        </div>
        <div className="card p-4">
          <Skeleton className="h-4 w-1/3" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
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
  const { id } = useParams()
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
      getStockDetail(id),
      getCandles(id),
      getTechnicalIndicators(id),
      getFinancialStatements(id),
      getShareholderAnalytics(id),
      getCorporateDocuments(id),
    ])
      .then(([detail, candleData, tech, fin, sh, docs]) => {
        if (cancelled) return
        setStock(detail)
        setCandles(candleData)
        setTechnical(tech)
        setFinancials(fin)
        setShareholders(sh)
        setDocuments(docs)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Data Fetch Error: ", err)
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading || !stock) return <PageSkeleton />

  // 🚀 PRO FIX: Default Failsafe Data to Prevent Crashes
  const safeConviction = stock.conviction || { score: 50, label: 'Neutral', thesis: 'AI Data is currently being generated for this stock.', reasons: [], risks: [] }
  const safeRedFlags = stock.redFlags || { questions: [], results: [] }
  const safeMeetings = stock.boardMeetings || []

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="card p-6">
        <StockHeader stock={stock} />
      </div>

      <nav className="sticky top-16 z-30 -mx-1 rounded-xl border border-slate-800 bg-terminal-900/90 px-2 py-2 backdrop-blur">
        <div className="flex flex-wrap gap-1">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-terminal-800 hover:text-slate-100"
            >
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      <SectionAnchor
        id="overview"
        title="Company Overview"
        subtitle={`Business profile, key highlights, strengths and risks for ${stock.symbol}`}
      >
        <CompanyOverview stock={stock} />
        <div className="mt-6">
          <ProsCons stock={stock} />
        </div>
      </SectionAnchor>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden p-4 lg:col-span-2">
          <SectionTitle
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v16h16" />
              </svg>
            }
            title="Advanced Chart"
            subtitle="Candlestick, volume, SMA 20/50, MACD & RSI · Powered by TradingView"
            right={<span className="chip bg-emerald-500/10 text-emerald-300">Live T-1</span>}
          />
          <TradingViewChart symbol={stock.symbol} candles={candles} />
        </div>

        <div className="card p-4">
          <SectionTitle
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            }
            title="Live News Feed"
            subtitle="AI-tagged by market impact"
          />
          <NewsFeed stockId={stock.id} />
        </div>
      </div>

      {/* 🚀 PRO FIX: Separated Financial Overview and Shareholding Pattern into full-width sections */}
      <div className="space-y-6">
        <div className="card p-4">
          <SectionTitle
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Financial Overview"
            subtitle="Key valuation & profitability metrics"
          />
          <FinancialOverview stock={stock} />
        </div>

        <div className="card p-4">
          <SectionTitle
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9 9 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            }
            title="Shareholding Pattern"
            subtitle="Promoters, FII, DII and public with pledge tracking"
          />
          {/* Now Shareholding Pattern has 100% width and will never overlap! */}
          <ShareholdingSection stock={stock} />
        </div>
      </div>

      <SectionAnchor id="technicals" title="Technical Indicators" subtitle="Moving averages and momentum signals">
        <TechnicalIndicators technical={technical} stock={stock} />
      </SectionAnchor>

      <SectionAnchor
        id="financials"
        title="Financial Statements"
        subtitle="Quarterly results, multi-year P&L, growth, balance sheet, cash flows and ratios"
      >
        <FinancialStatements data={financials} />
      </SectionAnchor>

      <SectionAnchor
        id="peers"
        title="Peer Comparison"
        subtitle={`Top peers in the ${stock.sector || 'Market'} sector and your own custom comparison basket`}
      >
        <PeerComparison stock={stock} />
      </SectionAnchor>

      <SectionAnchor
        id="shareholders"
        title="Shareholder Analytics"
        subtitle="Investor base size, ownership trend and pledge risk"
      >
        <ShareholderAnalytics stock={stock} data={shareholders} />
      </SectionAnchor>

      <SectionAnchor
        id="documents"
        title="Corporate Documents"
        subtitle="Regulatory filings, annual reports, credit ratings and earnings calls"
      >
        <CorporateDocuments stock={stock} data={documents} />
      </SectionAnchor>

      <div className="card p-4">
        <SectionTitle
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M15 9h.01M15 13h.01M9 17h.01M15 17h.01" />
            </svg>
          }
          title="Quarterly Results"
          subtitle="Latest four quarters of profit / loss performance"
        />
        <QuarterlySection stock={stock} />
      </div>

      <div className="card p-4">
        <SectionTitle
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="Board Meetings & Corporate Actions"
          subtitle="Upcoming and recent board events"
        />
        <BoardMeetings meetings={safeMeetings} />
      </div>

      <div className="card relative overflow-hidden p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <SectionTitle
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="AI Stock Analyzer"
            subtitle="Nifty 50 AI conviction with deep logical reasoning"
            right={isPremium ? <PremiumBadge small /> : undefined}
          />
        </div>
        <LockedOverlay
          title="AI Stock Analyzer is a Premium Feature"
          subtitle="Unlock the AI Conviction Meter and the 16-Point Forensic Red Flag & Moat Analyzer for this stock."
          teaser="One-click subscription · Instant access"
        >
          <div className="space-y-8">
            <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-5">
              <ConvictionMeter conviction={safeConviction} />
            </div>
            <div className="p-1">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">16-Point Forensic Red Flag & Moat Analyzer</h3>
                <PremiumBadge small />
              </div>
              <RedFlagAnalyzer redFlags={safeRedFlags} />
            </div>
          </div>
        </LockedOverlay>
      </div>

      {!isPremium && (
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-terminal-850 to-terminal-800 p-4 text-center text-xs text-slate-500">
          This demo simulates live market data. Upgrade to Premium for the full AI-driven analysis across all Nifty 50 stocks.
        </div>
      )}
    </div>
  )
}
