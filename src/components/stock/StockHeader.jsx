import { Link } from 'react-router-dom'
import { formatMarketCap, formatPercent, formatPrice } from '../../utils/format'
import Help from '../ui/Help'
import { useApp } from '../../context/AppContext'

const STAT_CARD = 'rounded-xl border border-slate-800 bg-terminal-850 p-4'

export default function StockHeader({ stock }) {
  const { watchlist, toggleWatchlist } = useApp()
  const inList = watchlist.includes(stock.id)
  const up = stock.changePct >= 0
  const color = up ? 'text-emerald-400' : 'text-rose-400'

  const stats = [
    { label: 'Market Cap', value: formatMarketCap(stock.marketCap), help: 'marketCap' },
    { label: 'Open', value: formatPrice(stock.open), help: 'open' },
    { label: 'Day High', value: formatPrice(stock.dayHigh), help: 'dayHigh' },
    { label: 'Day Low', value: formatPrice(stock.dayLow), help: 'dayLow' },
    { label: '52W High', value: formatPrice(stock.fiftyTwoWHigh), help: 'fiftyTwoWHigh' },
    { label: '52W Low', value: formatPrice(stock.fiftyTwoWLow), help: 'fiftyTwoWLow' },
    { label: 'Volume', value: stock.volume ? `${(stock.volume / 1000000).toFixed(2)}M` : '—', help: 'volume' },
    { label: 'Turnover', value: stock.turnover ? `\u20B9${stock.turnover.toFixed(1)} Cr` : '—', help: 'turnover' },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{stock.name}</h1>
            <span className="chip bg-sky-500/10 text-sky-300">NSE</span>
            <span className="chip bg-slate-800 text-slate-300">{stock.sector}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span className="font-mono font-semibold text-slate-300">{stock.symbol}</span>
            <span>·</span>
            <span>{stock.industry}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-3xl font-extrabold ${color}`}>{formatPrice(stock.price)}</div>
          <div className={`mt-1 font-mono text-sm font-semibold ${color}`}>
            {up ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePct).toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {stats.map((s) => (
          <div key={s.label} className={STAT_CARD}>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</span>
              {s.help && <Help glossaryKey={s.help} iconSize="h-3 w-3" />}
            </div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-100">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => toggleWatchlist(stock.id)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            inList
              ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              : 'border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-400'
          }`}
        >
          <svg className="h-3.5 w-3.5" fill={inList ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {inList ? 'In Watchlist' : 'Add to Watchlist'}
        </button>
        <Link to="/screener" className="btn-ghost px-3 py-1.5 text-xs">
          View in Screener
        </Link>
        <Link to="/premium" className="btn-primary px-3 py-1.5 text-xs">
          Premium Analysis
        </Link>
        <span className="chip text-slate-400">
          Data: T-1 simulated · {formatPercent(stock.changePct)} today
        </span>
      </div>
    </div>
  )
}
