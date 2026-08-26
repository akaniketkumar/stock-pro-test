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
  const inputRef = useRef(null) // Naya ref input box control karne ke liye
  const navigate = useNavigate()
  const { watchlist, toggleWatchlist } = useApp()

  // Bahar click karne par dropdown band karne ka logic
  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Live FMP Search aur Debounce Logic
  useEffect(() => {
    let cancelled = false
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    
    setLoading(true)
    const timer = setTimeout(async () => {
      const res = await searchStocks(query)
      if (!cancelled) {
        setResults(res)
        setOpen(true)
        setActiveIndex(-1)
        setLoading(false)
      }
    }, 300) // 300ms delay to prevent API spam

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

  // Naya function: Ek click me search clear karne ke liye
  function clearSearch() {
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  // Keyboard controls
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      clearSearch()
      return
    }
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
    }
  }

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        {/* Search Icon */}
        <svg
          className={`pointer-events-none absolute left-3 text-slate-500 ${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search NSE/BSE stocks..."
          className={`input pl-9 pr-10 w-full ${size === 'lg' ? 'py-2.5 text-base' : ''}`}
        />
        
        {/* Naya Clear ('X') Button */}
        {query && !loading && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
        )}
      </div>

      {/* Dropdown Results Box */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-terminal-900 shadow-2xl animate-in fade-in duration-200">
          <div className="border-b border-slate-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex justify-between">
            <span>{results.length} result{results.length > 1 ? 's' : ''}</span>
            <span className="text-sky-500/70">NSE / BSE</span>
          </div>
          <ul className="max-h-80 overflow-auto">
            {results.map((stock, idx) => (
              <li key={stock.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => goTo(stock.id)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${
                    idx === activeIndex ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{stock.symbol}</span>
                      <span className="truncate text-xs text-slate-400">{stock.name}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {stock.sector || 'Equity'} · NSE
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="font-mono text-sm text-slate-100">{formatPrice(stock.price)}</div>
                      {stock.changePct !== 0 && (
                        <div className={`font-mono text-xs ${changeClass(stock.changePct)}`}>
                          {stock.changePct > 0 ? '+' : ''}{stock.changePct}%
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Blank Result Feedback Box */}
      {open && query && !loading && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700 bg-terminal-900 shadow-2xl p-4 text-center animate-in fade-in">
           <p className="text-sm text-slate-300">No stocks found for "{query}"</p>
           <p className="text-xs text-slate-500 mt-1">Try searching by company name or NSE ticker symbol.</p>
        </div>
      )}
    </div>
  )
}
