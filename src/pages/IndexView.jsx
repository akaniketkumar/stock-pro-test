import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getIndex } from '../services/api'
import SectionTitle from '../components/ui/SectionTitle'
import Help from '../components/ui/Help'
import { TableSkeleton, Spinner } from '../components/ui/Loading'
import { changeClass, formatMarketCap, formatNumber, formatPercent, formatPrice } from '../utils/format'

const EQUITY_INDICES = new Set(['NIFTY50', 'SENSEX', 'BANKNIFTY', 'MIDCAP', 'SMALLCAP'])

export default function IndexView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [index, setIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState('marketCap')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setIndex(null)
    getIndex(id)
      .then((res) => {
        if (!cancelled) {
          setIndex(res)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // Quietly refresh constituent live prices every 30s.
  useEffect(() => {
    let cancelled = false
    const interval = setInterval(async () => {
      const res = await getIndex(id)
      if (!cancelled && res) setIndex(res)
    }, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [id])

  const sorted = useMemo(() => {
    if (!index || !index.constituents) return []
    const arr = [...index.constituents]
    arr.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = av > bv ? 1 : av < bv ? -1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [index, sortKey, sortDir])

  function onSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortTh = ({ label, k, help, className = '' }) => (
    <th className={`cursor-pointer select-none px-4 py-3 font-semibold ${className}`} onClick={() => onSort(k)}>
      <span className="flex items-center gap-1">
        {label}
        {help && <Help glossaryKey={help} iconSize="h-3 w-3" />}
        {sortKey === k && (
          <svg className={`h-3 w-3 ${sortDir === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
          </svg>
        )}
      </span>
    </th>
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SkeletonHeader />
        <TableSkeleton rows={8} />
      </div>
    )
  }

  if (!index) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <h1 className="text-xl font-bold text-slate-100">Index not found</h1>
        <p className="max-w-sm text-sm text-slate-500">We could not find an index with id "{id}".</p>
        <Link to="/" className="btn-primary">
          Go Back
        </Link>
      </div>
    )
  }

  const up = index.changePct >= 0

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Market Overview
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{index.name}</h1>
              <span className="chip bg-sky-500/10 text-sky-300">{index.id}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {EQUITY_INDICES.has(index.id)
                ? `${index.constituentCount} constituent stock${index.constituentCount !== 1 ? 's' : ''} · Click any row to open its full analysis`
                : 'Non-equity benchmark · no listed constituents'}
            </p>
          </div>
          <div className="text-right">
            <div className={`font-mono text-3xl font-extrabold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatNumber(index.value, 2)}
            </div>
            <div className={`mt-1 font-mono text-sm font-semibold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {up ? '▲' : '▼'} {Math.abs(index.change).toFixed(2)} ({Math.abs(index.changePct).toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-terminal-850 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Index Value</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-100">{formatNumber(index.value, 2)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-terminal-850 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Day Change</div>
            <div className={`mt-1 font-mono text-sm font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {up ? '+' : ''}
              {formatPercent(index.changePct, 2)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-terminal-850 p-4">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Constituents
              <Help text="The listed companies that make up this index. Click a row to open that stock's full analysis page." iconSize="h-3 w-3" />
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-100">{index.constituentCount}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-terminal-850 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Benchmark Type</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-100">{EQUITY_INDICES.has(index.id) ? 'Equity' : 'Commodity / FX / Vol'}</div>
          </div>
        </div>
      </div>

      {EQUITY_INDICES.has(index.id) ? (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-3">
            <SectionTitle
              title={`${index.name} Constituents`}
              subtitle={`Top ${index.constituentCount} stocks in the index, ranked by market cap`}
              right={<span className="chip bg-slate-800 text-slate-400">Live NSE prices</span>}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-800 bg-terminal-900/40 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      Company
                      <Help text="The constituent company. Click any row to open its full analysis page." iconSize="h-3 w-3" />
                    </span>
                  </th>
                  <SortTh label="Price" k="price" help="price" className="px-4 py-3 text-right" />
                  <SortTh label="Chg %" k="changePct" help="changePct" className="px-4 py-3 text-right" />
                  <SortTh label="Mkt Cap" k="marketCap" help="marketCap" className="px-4 py-3 text-right" />
                  <SortTh label="P/E" k="pe" help="pe" className="px-4 py-3 text-right" />
                  <SortTh label="ROCE" k="roce" help="roce" className="px-4 py-3 text-right" />
                  <SortTh label="ROE" k="roe" help="roe" className="px-4 py-3 text-right" />
                  <SortTh label="D/E" k="debtToEquity" help="debtToEquity" className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, idx) => (
                  <tr
                    key={s?.id || idx}
                    className="cursor-pointer border-b border-slate-800/50 transition-colors hover:bg-terminal-800/50"
                    onClick={() => s?.id && navigate(`/stock/${s.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-100">{s?.symbol || '—'}</span>
                        <span className="hidden text-xs text-slate-500 lg:inline">{s?.name || ''}</span>
                        <span className="hidden text-[10px] text-slate-600 xl:inline">{s?.sector || ''}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200">{formatPrice(s?.price)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${changeClass(s?.changePct)}`}>
                      {formatPercent(s?.changePct ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{formatMarketCap(s?.marketCap)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{s?.pe ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{s?.roce ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{s?.roe ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{s?.debtToEquity ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
            <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">No listed constituents</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {index.name} is a {index.id === 'GOLD' ? 'commodity' : index.id === 'USDINR' ? 'currency' : 'volatility'}{' '}
              benchmark and does not track a fixed set of listed companies.
            </p>
          </div>
          <Link to="/" className="btn-ghost">
            Back to Market Overview
          </Link>
        </div>
      )}
    </div>
  )
}

function SkeletonHeader() {
  return (
    <div className="card p-6">
      <div className="h-7 w-52 animate-pulse rounded bg-slate-800" />
      <div className="mt-3 h-9 w-40 animate-pulse rounded bg-slate-800" />
      <div className="mt-5 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  )
}
