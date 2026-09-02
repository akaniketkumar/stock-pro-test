import { Link } from 'react-router-dom'
import Help from '../ui/Help'
import { useApp } from '../../context/AppContext'
import { formatMarketCap, formatPercent, formatPrice } from '../../utils/format'

export default function StockCard({ stock }) {
  const up = stock.changePct >= 0
  const { watchlist, toggleWatchlist } = useApp()
  const inList = watchlist.includes(stock.id)

  return (
    <Link
      to={`/stock/${stock.id}`}
      className="card card-hover group relative block p-4"
    >
      <button
        type="button"
        aria-label={inList ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleWatchlist(stock.id)
        }}
        className={`absolute right-3 top-3 rounded-full p-1 transition-colors ${
          inList ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-amber-400'
        }`}
      >
        <svg className="h-4 w-4" fill={inList ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>

      <div className="flex items-start justify-between gap-2 pr-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-100">{stock.symbol}</span>
            {stock.rating && (
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                  stock.rating === 'BUY'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : stock.rating === 'SELL'
                      ? 'bg-rose-500/15 text-rose-300'
                      : 'bg-slate-700/60 text-slate-300'
                }`}
              >
                {stock.rating}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">{stock.name}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-bold text-slate-100">{formatPrice(stock.price)}</div>
          <div className={`font-mono text-xs ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatPercent(stock.changePct)}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-slate-500">
            Mkt Cap
            <Help glossaryKey="marketCap" iconSize="h-2.5 w-2.5" />
          </div>
          <div className="font-mono text-[11px] text-slate-300">{formatMarketCap(stock.marketCap)}</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-slate-500">
            P/E
            <Help glossaryKey="pe" iconSize="h-2.5 w-2.5" />
          </div>
          <div className="font-mono text-[11px] text-slate-300">{stock.pe ?? '—'}</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-slate-500">
            RoE
            <Help glossaryKey="roe" iconSize="h-2.5 w-2.5" />
          </div>
          <div className="font-mono text-[11px] text-slate-300">{stock.roe != null ? `${stock.roe}%` : '—'}</div>
        </div>
      </div>
    </Link>
  )
}
