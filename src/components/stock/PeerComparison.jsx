import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPeers, getComparison, searchStocks } from '../../services/api'
import Help from '../ui/Help'
import { ErrorState, Skeleton } from '../ui/Loading'
import { changeClass, formatMarketCap, formatPrice } from '../../utils/format'

function qtrCell(value) {
  if (value === null || value === undefined) return '—'
  return <span className={changeClass(value)}>{value > 0 ? '+' : ''}{value}%</span>
}

function PeerTable({ stock, peers }) {
  const rows = [
    { stock, salesQtrGrowth: null, npQtrGrowth: null, isSelf: true },
    ...peers,
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-800 bg-terminal-900/40 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">
              <span className="inline-flex items-center gap-1">Company<Help glossaryKey="marketCap" /></span>
            </th>
            <th className="px-4 py-3 text-right font-semibold">Mkt Cap</th>
            <th className="px-4 py-3 text-right font-semibold">P/E</th>
            <th className="px-4 py-3 text-right font-semibold">ROCE</th>
            <th className="px-4 py-3 text-right font-semibold">Sales Qtr %</th>
            <th className="px-4 py-3 text-right font-semibold">NP Qtr %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.stock.id}
              className={`border-b border-slate-800/50 ${row.isSelf ? 'bg-sky-500/5' : 'transition-colors hover:bg-terminal-800/40'}`}
            >
              <td className="px-4 py-3">
                <Link to={`/stock/${row.stock.id}`} className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-100">{row.stock.symbol}</span>
                  <span className="hidden text-xs text-slate-500 xl:inline">{row.stock.name}</span>
                  {row.isSelf && <span className="chip bg-sky-500/15 text-sky-300">You</span>}
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-mono text-slate-300">{formatMarketCap(row.stock.marketCap)}</td>
              <td className="px-4 py-3 text-right font-mono text-slate-300">{row.stock.pe ?? '—'}</td>
              <td className="px-4 py-3 text-right font-mono text-slate-300">{row.stock.roce != null ? `${row.stock.roce}%` : '—'}</td>
              <td className="px-4 py-3 text-right font-mono">
                {row.isSelf ? '—' : qtrCell(row.salesQtrGrowth)}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {row.isSelf ? '—' : qtrCell(row.npQtrGrowth)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const METRICS = [
  { label: 'Market Cap', get: (s) => formatMarketCap(s.stock.marketCap), help: 'marketCap' },
  { label: 'Current Price', get: (s) => formatPrice(s.stock.price), help: 'price' },
  { label: 'P/E Ratio', get: (s) => s.stock.pe ?? '—', help: 'pe' },
  { label: 'P/B Ratio', get: (s) => s.stock.pb ?? '—', help: 'pb' },
  { label: 'ROCE', get: (s) => (s.stock.roce != null ? `${s.stock.roce}%` : '—'), help: 'roce' },
  { label: 'ROE', get: (s) => (s.stock.roe != null ? `${s.stock.roe}%` : '—'), help: 'roe' },
  { label: 'Debt / Equity', get: (s) => (s.stock.debtToEquity != null ? s.stock.debtToEquity.toFixed(2) : '—'), help: 'debtToEquity' },
  { label: 'Sales Qtr Growth', get: (s) => (s.salesQtrGrowth != null ? `${s.salesQtrGrowth}%` : '—'), help: 'salesQtrGrowth' },
  { label: 'NP Qtr Growth', get: (s) => (s.npQtrGrowth != null ? `${s.npQtrGrowth}%` : '—'), help: 'profitQtrGrowth' },
  { label: 'Promoter Holding', get: (s) => (s.stock.promoterHolding != null ? `${s.stock.promoterHolding}%` : '—'), help: 'promoterHolding' },
  { label: 'Promoter Pledge', get: (s) => (s.stock.promoterPledge > 0 ? `${s.stock.promoterPledge}%` : 'None'), help: 'promoterPledge' },
  { label: 'Free Cash Flow', get: (s) => (s.stock.freeCashFlow != null ? `\u20B9${s.stock.freeCashFlow.toLocaleString('en-IN')} Cr` : '—'), help: 'freeCashFlow' },
]

function CustomCompare({ stock }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState([stock.id])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getComparison([stock.id]).then((res) => {
      if (!cancelled) {
        setData(res)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [stock.id])

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      const res = await searchStocks(query)
      if (!cancelled) setSuggestions(res.filter((s) => !selected.includes(s.id)))
    }, 160)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, selected])

  function add(id) {
    if (selected.length >= 4 || selected.includes(id)) return
    const next = [...selected, id]
    setSelected(next)
    getComparison(next).then(setData)
    setQuery('')
  }

  function remove(id) {
    const next = selected.filter((x) => x !== id)
    setSelected(next)
    getComparison(next).then(setData)
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-terminal-900/40 p-4">
      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-100">
        Custom Comparison Tool
        <Help text="Search and add up to 4 companies to compare them side-by-side on key metrics." />
      </h4>

      <div className="relative mt-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Add a company to compare (e.g. ICICIBANK, TCS)..."
          className="input pl-9"
        />
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {suggestions.length > 0 && (
          <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-700 bg-terminal-900 shadow-2xl">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => add(s.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-terminal-800"
                >
                  <span>
                    <span className="font-mono text-sm font-semibold text-slate-100">{s.symbol}</span>
                    <span className="ml-2 text-xs text-slate-500">{s.name}</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400">{formatPrice(s.price)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((id) => {
            const item = data?.find((d) => d.stock.id === id)
            return (
              <span key={id} className="chip bg-slate-800 px-3 py-1.5 font-mono text-slate-200">
                {item?.stock.symbol || id}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="ml-2 text-slate-400 hover:text-rose-400"
                  aria-label={`Remove ${id}`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )
          })}
          {selected.length < 4 && <span className="text-xs text-slate-600">Add up to {4 - selected.length} more</span>}
        </div>
      )}

      {loading ? (
        <Skeleton className="mt-4 h-64" />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Metric</th>
                {data.map((d) => (
                  <th key={d.stock.id} className="px-3 py-2.5 text-right font-semibold">
                    <Link to={`/stock/${d.stock.id}`} className="hover:text-sky-300">
                      {d.stock.symbol}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => (
                <tr key={m.label} className="border-b border-slate-800/50">
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      {m.label}
                      <Help glossaryKey={m.help} iconSize="h-3 w-3" />
                    </span>
                  </td>
                  {data.map((d) => {
                    const raw = m.get(d)
                    const negative = typeof raw === 'string' && raw.startsWith('-')
                    return (
                      <td key={d.stock.id} className={`px-3 py-2.5 text-right font-mono text-slate-200 ${negative ? 'text-rose-400' : ''}`}>
                        {raw}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function PeerComparison({ stock }) {
  const [peers, setPeers] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setPeers(null)
    setError(false)
    getPeers(stock.id)
      .then((res) => {
        // Defensive: drop any malformed entry (missing id/symbol) instead of
        // letting a bad row crash the table render.
        const clean = Array.isArray(res) ? res.filter((p) => p && p.id && p.symbol) : []
        if (!cancelled) setPeers(clean)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [stock.id])

  if (error) return <ErrorState message="Could not load peer comparison." />

  return (
    <div>
      {!peers ? (
        <Skeleton className="h-56" />
      ) : (
        <>
          <PeerTable stock={stock} peers={peers} />
          <p className="mt-2 text-[11px] text-slate-500">
            Top {peers.length} peers in the <span className="text-slate-400">{stock.sector}</span> sector by market cap. Sales/NP Qtr % is the latest quarter's QoQ growth.
          </p>
          <CustomCompare stock={stock} />
        </>
      )}
    </div>
  )
}
