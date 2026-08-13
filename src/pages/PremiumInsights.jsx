import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPremiumInsights } from '../services/api'
import SectionTitle, { PremiumBadge } from '../components/ui/SectionTitle'
import LockedOverlay, { SubscribeModal } from '../components/ui/LockedOverlay'
import Help from '../components/ui/Help'
import { Spinner, TableSkeleton } from '../components/ui/Loading'
import { useApp } from '../context/AppContext'
import { formatMarketCap, formatPrice } from '../utils/format'

function scoreColor(score) {
  if (score >= 75) return { color: '#34d399', label: 'Strong Bullish' }
  if (score >= 60) return { color: '#38bdf8', label: 'Bullish' }
  if (score >= 45) return { color: '#94a3b8', label: 'Neutral' }
  if (score >= 30) return { color: '#fbbf24', label: 'Bearish' }
  return { color: '#fb7185', label: 'Strong Bearish' }
}

export default function PremiumInsights() {
  const { isPremium } = useApp()
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    getPremiumInsights()
      .then((data) => {
        setInsights(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <SectionTitle title="Premium Insights" subtitle="AI conviction across the Nifty 50" right={<PremiumBadge small />} />
        </div>
        <TableSkeleton rows={6} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white">
            Premium Insights
            <Help text="AI Conviction scores for the Nifty 50, powered by the 16-point forensic engine. The score combines technical trend, fundamentals, cash-flow quality and red-flag checks." />
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            AI Conviction Meter and deep reasoning on the Nifty 50 — refreshed daily with T-1 data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PremiumBadge />
          {!isPremium && (
            <button type="button" onClick={() => setShowModal(true)} className="btn bg-gradient-to-r from-amber-400 to-yellow-500 font-bold text-terminal-950 hover:from-amber-300 hover:to-yellow-400">
              Subscribe
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {insights.map((insight) => {
          const meta = scoreColor(insight.conviction.score)
          return (
            <div key={insight.id} className="card card-hover relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-15" style={{ backgroundColor: meta.color }} />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-sm font-bold text-slate-100">{insight.symbol}</div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{insight.name}</div>
                </div>
                <span className="font-mono text-xs font-bold" style={{ color: meta.color }}>
                  {formatPrice(insight.price)}
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1">
                    Conviction
                    <Help glossaryKey="conviction" iconSize="h-3 w-3" />
                  </span>
                  <span style={{ color: meta.color }}>{insight.conviction.score}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full transition-all" style={{ width: `${insight.conviction.score}%`, backgroundColor: meta.color }} />
                </div>
                <div className="mt-1.5 text-xs font-bold" style={{ color: meta.color }}>
                  {meta.label}
                </div>
              </div>

              <div className={`relative mt-4 ${isPremium ? '' : 'pointer-events-none select-none blur-[6px]'}`}>
                <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">{insight.conviction.thesis}</p>
                <ul className="mt-3 space-y-1.5">
                  {(insight.conviction.reasons || []).slice(0, 2).map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                      <svg className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  Mkt cap {formatMarketCap(insight.marketCap)}
                  <Help glossaryKey="marketCap" iconSize="h-3 w-3" />
                </span>
                <Link to={`/stock/${insight.id}`} className="text-xs font-semibold text-sky-400 hover:text-sky-300">
                  Full report →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {!isPremium && (
        <div className="card mt-8 p-8">
          <LockedOverlay
            title="Unlock the full AI Stock Analyzer"
            subtitle="Every insight above is powered by the 16-point forensic engine. Subscribe to see full reasoning, red-flag reports and the conviction meter on every stock."
            teaser="Instant access after one click"
          >
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-xl border border-slate-800 bg-terminal-900/50 p-5">
                    <div className="h-16 w-16 rounded-full border-4 border-slate-700" />
                    <div className="mt-4 h-3 w-3/4 rounded bg-slate-700" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-slate-800" />
                    <div className="mt-4 h-2 rounded bg-slate-800" />
                    <div className="mt-2 h-2 rounded bg-slate-800" />
                  </div>
                ))}
              </div>
            </div>
          </LockedOverlay>
        </div>
      )}

      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
