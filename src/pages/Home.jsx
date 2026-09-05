import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllStocks, getIndices, getIPOs } from '../services/api'
import SearchBar from '../components/layout/SearchBar'
import StockCard from '../components/stock/StockCard'
import SectionTitle, { PremiumBadge } from '../components/ui/SectionTitle'
import Help from '../components/ui/Help'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui/Loading'
import { changeClass, formatNumber } from '../utils/format'

function IndexGrid({ indices }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {indices.map((ix) => (
        <Link key={ix.id} to={`/index/${ix.id}`} className="card card-hover group block p-3">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {ix.name}
            <Help text="Index level and the day's change in points/percent versus the previous close. Click a card to view its constituent stocks." iconSize="h-3 w-3" />
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-slate-100">{formatNumber(ix.value, 2)}</div>
          <div className={`font-mono text-xs ${changeClass(ix.changePct)}`}>
            {ix.changePct > 0 ? '▲' : ix.changePct < 0 ? '▼' : ''} {Math.abs(ix.changePct ?? 0).toFixed(2)}%
          </div>
          <div className="mt-1 hidden text-[9px] font-semibold uppercase tracking-wider text-sky-400 opacity-0 transition-opacity group-hover:opacity-100">
            View constituents →
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function Home() {
  const { watchlist } = useApp()
  const [stocks, setStocks] = useState([])
  const [indices, setIndices] = useState([])
  const [ipos, setIpos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getAllStocks(), getIndices(), getIPOs()])
      .then(([s, ix, ip]) => {
        if (cancelled) return
        setStocks(s)
        setIndices(ix)
        setIpos(ip)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Auto-refresh live prices every 30s and whenever the tab regains focus,
    // without showing the full-page loading spinner again.
    function refreshPrices() {
      getAllStocks()
        .then((s) => {
          if (!cancelled) setStocks(s)
        })
        .catch(() => {})
    }
    const interval = setInterval(refreshPrices, 30000)
    function onVisible() {
      if (document.visibilityState === 'visible') refreshPrices()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (loading) return <Spinner label="Loading markets..." className="py-32" />

  const gainers = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 4)
  const losers = [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 4)
  const openIpos = ipos.filter((i) => i.status === 'Open')
  const upcomingIpos = ipos.filter((i) => i.status === 'Upcoming')
  const featured = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HAL', 'ZOMATO', 'TATAMOTORS', 'SBIN']
    .map((id) => stocks.find((s) => s.id === id))
    .filter(Boolean)

  const watchlistStocks = watchlist.map((id) => stocks.find((s) => s.id === id)).filter(Boolean)

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-950/60 via-terminal-900 to-terminal-950 p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="chip bg-sky-500/10 text-sky-300">India · NSE</span>
            <span className="chip bg-emerald-500/10 text-emerald-300">Live NSE prices</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            One search. <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Pro-grade</span> stock intelligence.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            AI-powered conviction, 16-point forensic red-flag screening, live sentiment news and a powerful screener —
            built for beginners, packed with professional data.
          </p>
          <div className="mt-6 max-w-xl">
            <SearchBar size="lg" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/screener" className="btn-primary">
              Open Screener
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link to="/premium" className="btn-ghost">
              Explore Premium
            </Link>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle
          title="Market Overview"
          subtitle="Key indices and macro indicators"
          helpText="Snapshot of the major Indian indices. The change % shows how each index has moved today relative to the previous close."
          right={
            <span className="chip bg-slate-800 text-slate-400">
              <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-emerald-400" />
              Live
            </span>
          }
        />
        <IndexGrid indices={indices} />
      </section>

      <section>
        <SectionTitle
          title="Top Movers"
          subtitle="Biggest daily movers across the Nifty 50"
          helpText="The four stocks with the largest percentage gains today. A gainer's price has risen the most in a single session."
          right={
            <Link to="/screener" className="text-xs font-semibold text-sky-400 hover:text-sky-300">
              View all →
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gainers.map((s) => (
            <StockCard key={s.id} stock={s} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Top Losers"
          subtitle="Biggest daily decliners"
          helpText="The four stocks that fell the most in percentage terms today. Click any card to open its full analysis page."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {losers.map((s) => (
            <StockCard key={s.id} stock={s} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Featured Stocks"
          subtitle="Deep-dive analysis universe"
          helpText="A curated set of Nifty 50 names with full analysis pages — company profile, financials, technicals, peers and shareholder data."
          right={
            <Link to="/screener" className="text-xs font-semibold text-sky-400 hover:text-sky-300">
              All stocks →
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((s) => (
            <StockCard key={s.id} stock={s} />
          ))}
        </div>
      </section>

      <section id="watchlist" className="scroll-mt-24">
        <SectionTitle
          title="Your Watchlist"
          subtitle={watchlistStocks.length > 0 ? `${watchlistStocks.length} stock${watchlistStocks.length !== 1 ? 's' : ''} saved for quick access` : 'Star stocks to track them here'}
          helpText="Star any stock card or open a stock's detail page and click 'Add to Watchlist'. Your list is saved on this device."
          right={
            <Link to="/screener" className="text-xs font-semibold text-sky-400 hover:text-sky-300">
              Add more →
            </Link>
          }
        />
        {watchlistStocks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {watchlistStocks.map((s) => (
              <StockCard key={s.id} stock={s} />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-4 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
              <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Your watchlist is empty</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Tap the star on any stock card or open a stock's detail page to start building your own Nifty 50
                watchlist.
              </p>
            </div>
            <Link to="/screener" className="btn-ghost">
              Browse stocks to add
            </Link>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="flex items-center gap-2">
            <PremiumBadge />
          </div>
          <h3 className="mt-3 text-xl font-bold text-white">AI Stock Analyzer</h3>
          <p className="mt-2 text-sm text-slate-400">
            Get the AI Conviction Meter and the complete 16-Point Forensic Red Flag & Moat Analyzer on every Nifty 50
            stock — automatic, deep, and opinionated.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {['Strong Bullish / Bearish conviction score', '16-point forensic check with pass/danger verdicts', 'Promoter pledge & cash-flow forensics'].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.285-3.958a1 1 0 00-.363-1.118L2.71 9.385c-.784-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.639-3.958z" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <Link to="/premium" className="btn bg-gradient-to-r from-amber-400 to-yellow-500 font-bold text-terminal-950 hover:from-amber-300 hover:to-yellow-400">
            Discover Premium
          </Link>
        </div>

        <div className="card p-6">
          <h3 className="flex items-center gap-2 text-xl font-bold text-white">
            IPO Watch
            <span className="chip bg-slate-800 text-slate-400">Coming Soon</span>
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Real IPO data (GMP, subscription, listing details) needs a paid feed to be accurate — this will go live once that's connected.
          </p>
        </div>
      </section>
    </div>
  )
}
