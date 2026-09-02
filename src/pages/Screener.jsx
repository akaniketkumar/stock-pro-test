import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { screenStocks } from '../services/api'
import Slider from '../components/ui/Slider'
import Help from '../components/ui/Help'
import SectionTitle from '../components/ui/SectionTitle'
import { Spinner, TableSkeleton } from '../components/ui/Loading'
import { changeClass, formatMarketCap, formatPercent, formatPrice } from '../utils/format'

const SECTORS = ['Banking', 'Information Technology', 'Consumer Staples', 'Automobile', 'Oil & Gas', 'Healthcare', 'Financial Services', 'Infrastructure', 'Metals', 'Telecom', 'Defence', 'Consumer Services']

const DEFAULTS = {
  maxPE: 200,
  minMarketCap: 0,
  minRoce: 0,
  minRoe: 0,
  maxDebtToEquity: 20,
  minChangePct: -10,
  maxChangePct: 20,
  maxPledge: 100,
  requirePositiveFCF: false,
  requirePositiveProfit: false,
  sectors: [],
}

function fmtCrore(v) {
  if (v >= 100000) return `${(v / 1000).toFixed(0)}K Cr`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K Cr`
  return `${v} Cr`
}

function activeCount(f) {
  let count = 0
  if (f.maxPE !== DEFAULTS.maxPE) count += 1
  if (f.minMarketCap !== DEFAULTS.minMarketCap) count += 1
  if (f.minRoce !== DEFAULTS.minRoce) count += 1
  if (f.minRoe !== DEFAULTS.minRoe) count += 1
  if (f.maxDebtToEquity !== DEFAULTS.maxDebtToEquity) count += 1
  if (f.minChangePct !== DEFAULTS.minChangePct) count += 1
  if (f.maxChangePct !== DEFAULTS.maxChangePct) count += 1
  if (f.maxPledge !== DEFAULTS.maxPledge) count += 1
  if (f.requirePositiveFCF) count += 1
  if (f.requirePositiveProfit) count += 1
  if (f.sectors.length) count += 1
  return count
}

function Toggle({ label, checked, onChange, sub }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-2 py-1.5 text-left">
      <span>
        <span className="block text-xs font-semibold text-slate-300">{label}</span>
        {sub && <span className="block text-[10px] text-slate-500">{sub}</span>}
      </span>
      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-sky-500' : 'bg-slate-700'}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
      </span>
    </button>
  )
}

export default function Screener() {
  const [filters, setFilters] = useState(DEFAULTS)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState('marketCap')
  const [sortDir, setSortDir] = useState('desc')
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      const res = await screenStocks(filters)
      if (!cancelled) {
        setResults(res)
        setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [filters])

  // Quietly refresh live prices every 30s without disturbing filters/sort/scroll.
  useEffect(() => {
    let cancelled = false
    const interval = setInterval(async () => {
      const res = await screenStocks(filters)
      if (!cancelled) setResults(res)
    }, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [filters])

  const sorted = useMemo(() => {
    const arr = [...results]
    arr.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = av > bv ? 1 : av < bv ? -1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [results, sortKey, sortDir])

  function set(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSector(sector) {
    setFilters((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(sector) ? prev.sectors.filter((s) => s !== sector) : [...prev.sectors, sector],
    }))
  }

  function reset() {
    setFilters(DEFAULTS)
  }

  function onSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortTh = ({ label, k, help, numeric = true, className = '' }) => (
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Stock Screener</h1>
        <p className="mt-1 text-sm text-slate-400">
          Drag the sliders to filter the Nifty 50 universe instantly. Results update in real time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100">Filters</h2>
              <button type="button" onClick={reset} className="text-xs font-semibold text-sky-400 hover:text-sky-300">
                Reset all
              </button>
            </div>

            <div className="space-y-5">
              <Slider label="Max P/E Ratio" help="pe" min={0} max={200} step={1} value={filters.maxPE} onChange={(v) => set('maxPE', v)} />
              <Slider
                label="Min Market Cap"
                help="marketCap"
                min={0}
                max={400000}
                step={1000}
                value={filters.minMarketCap}
                onChange={(v) => set('minMarketCap', v)}
                format={fmtCrore}
              />
              <Slider label="Min ROCE (%)" help="roce" min={0} max={40} step={1} value={filters.minRoce} onChange={(v) => set('minRoce', v)} format={(v) => `${v}%`} />
              <Slider label="Min ROE (%)" help="roe" min={0} max={40} step={1} value={filters.minRoe} onChange={(v) => set('minRoe', v)} format={(v) => `${v}%`} />
              <Slider
                label="Max Debt / Equity"
                help="debtToEquity"
                min={0}
                max={20}
                step={0.1}
                value={filters.maxDebtToEquity}
                onChange={(v) => set('maxDebtToEquity', v)}
                format={(v) => v.toFixed(1)}
              />
              <Slider label="Min Day Change (%)" help="changePct" min={-10} max={20} step={0.5} value={filters.minChangePct} onChange={(v) => set('minChangePct', v)} format={(v) => `${v}%`} />
              <Slider label="Max Day Change (%)" help="changePct" min={-10} max={20} step={0.5} value={filters.maxChangePct} onChange={(v) => set('maxChangePct', v)} format={(v) => `${v}%`} />
              <Slider label="Max Promoter Pledge (%)" help="promoterPledge" min={0} max={100} step={1} value={filters.maxPledge} onChange={(v) => set('maxPledge', v)} format={(v) => `${v}%`} />
            </div>

            <div className="mt-5 border-t border-slate-800 pt-4">
              <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-300">
                Quality toggles
                <Help text="Optional filters for financial quality. Toggle them on to only see stocks that pass." iconSize="h-3 w-3" />
              </div>
              <div className="flex flex-col">
                <Toggle label="Positive Free Cash Flow" sub="FCF > 0 (Cr)" checked={filters.requirePositiveFCF} onChange={(v) => set('requirePositiveFCF', v)} />
                <Toggle label="Positive Net Profit" sub="Net profit > 0" checked={filters.requirePositiveProfit} onChange={(v) => set('requirePositiveProfit', v)} />
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800 pt-4">
              <div className="mb-2 text-xs font-semibold text-slate-300">Sectors</div>
              <div className="flex flex-wrap gap-1.5">
                {SECTORS.map((sector) => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => toggleSector(sector)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      filters.sectors.includes(sector)
                        ? 'bg-sky-500 text-white'
                        : 'border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800 pt-3 text-center text-xs text-slate-500">
              {activeCount(filters)} active filter{activeCount(filters) !== 1 ? 's' : ''}
            </div>
          </div>
        </aside>

        <section>
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-100">
                Results
                <Help text="Live results matching your filters. Click any column header to sort; click a row to open the full stock report." iconSize="h-3 w-3" />
                <span className="ml-1 rounded bg-sky-500/15 px-2 py-0.5 font-mono text-xs font-bold text-sky-300">
                  {loading ? '…' : sorted.length}
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="chip">Live NSE prices</span>
                <span className="chip">Nifty 50</span>
              </div>
            </div>

            {loading ? (
              <TableSkeleton rows={8} />
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <svg className="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-400">No stocks match your current filters.</p>
                <button type="button" onClick={reset} className="btn-ghost">
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="border-b border-slate-800 bg-terminal-900/40 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          Company
                          <Help text="The Nifty 50 company. Click any row to open its full analysis page." iconSize="h-3 w-3" />
                        </span>
                      </th>
                      <SortTh label="Price" k="price" help="price" className="px-4 py-3 text-right" />
                      <SortTh label="Chg %" k="changePct" help="changePct" className="px-4 py-3 text-right" />
                      <SortTh label="Mkt Cap" k="marketCap" help="marketCap" className="px-4 py-3 text-right" />
                      <SortTh label="P/E" k="pe" help="pe" className="px-4 py-3 text-right" />
                      <SortTh label="ROCE" k="roce" help="roce" className="px-4 py-3 text-right" />
                      <SortTh label="ROE" k="roe" help="roe" className="px-4 py-3 text-right" />
                      <SortTh label="D/E" k="debtToEquity" help="debtToEquity" className="px-4 py-3 text-right" />
                      <SortTh label="Pledge" k="promoterPledge" help="promoterPledge" className="px-4 py-3 text-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((s) => (
                      <tr
                        key={s.id}
                        className="cursor-pointer border-b border-slate-800/50 transition-colors hover:bg-terminal-800/50"
                        onClick={() => navigate(`/stock/${s.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-100">{s.symbol}</span>
                            <span className="hidden text-xs text-slate-500 lg:inline">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-200">{formatPrice(s.price)}</td>
                        <td className={`px-4 py-3 text-right font-mono ${changeClass(s.changePct)}`}>
                          {formatPercent(s.changePct)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">{formatMarketCap(s.marketCap)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">{s.pe ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">{s.roce ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">{s.roe ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">
                          {s.debtToEquity ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono text-xs font-bold ${s.promoterPledge > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {s.promoterPledge > 0 ? `${s.promoterPledge}%` : '0%'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
