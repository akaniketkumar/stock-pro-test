import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchStocks } from '../../services/api'
import { useApp } from '../../context/AppContext'
import { changeClass, formatPrice } from '../../utils/format'

export default function SearchBar({ className = '', size = 'md' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef(null)
  const navigate = useNavigate()
  const { watchlist, toggleWatchlist } = useApp()

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      const res = await searchStocks(query)
      if (!cancelled) {
        setResults(res)
        setOpen(query.length > 0)
        setActiveIndex(-1)
        setLoading(false)
      }
    }, 180)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  function goTo(id) {
    setOpen(false)
    setQuery('')
    navigate(`/stock/${id}`)
  }

  function onKeyDown(e) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = activeIndex >= 0 ? results[activeIndex] : results[0]
      if (target) goTo(target.id)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <svg
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 ${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search stocks, e.g. RELIANCE, TCS..."
          className={`input pl-9 pr-9 ${size === 'lg' ? 'py-2.5 text-base' : ''}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-terminal-900 shadow-2xl">
          <div className="border-b border-slate-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {results.length} result{results.length > 1 ? 's' : ''}
          </div>
          <ul className="max-h-80 overflow-auto">
            {results.map((stock, idx) => (
              <li key={stock.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => goTo(stock.id)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${
                    idx === activeIndex ? 'bg-terminal-800' : 'hover:bg-terminal-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{stock.symbol}</span>
                      <span className="truncate text-xs text-slate-400">{stock.name}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {stock.industry} · NSE
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="font-mono text-sm text-slate-100">{formatPrice(stock.price)}</div>
                      <div className={`font-mono text-xs ${changeClass(stock.changePct)}`}>
                        {stock.changePct > 0 ? '+' : ''}
                        {stock.changePct}%
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={watchlist.includes(stock.id) ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        toggleWatchlist(stock.id)
                      }}
                      className={`rounded-full p-1 transition-colors ${
                        watchlist.includes(stock.id) ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
                      }`}
                    >
                      <svg className="h-4 w-4" fill={watchlist.includes(stock.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
