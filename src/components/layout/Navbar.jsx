import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import SearchBar from './SearchBar'
import Help from '../ui/Help'
import { useApp } from '../../context/AppContext'
import { getIndices } from '../../services/api'
import { changeClass, formatNumber } from '../../utils/format'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/screener', label: 'Screener' },
  { to: '/ipos', label: 'IPOs' },
  { to: '/premium', label: 'Premium Insights' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 shadow-glow">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-6 4 4 8-9" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-white">
        Stock<span className="text-sky-400">Pro</span>
      </span>
    </Link>
  )
}

export default function Navbar() {
  const { user, logout, watchlist } = useApp()
  const [indices, setIndices] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    getIndices().then(setIndices).catch(() => {})
  }, [])

  const tickerItems = indices.slice(0, 6)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-terminal-950/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          <Logo />

          <div className="hidden flex-1 md:block">
            <SearchBar />
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link
              to="/#watchlist"
              aria-label={`Watchlist (${watchlist.length} saved)`}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              {watchlist.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 font-mono text-[9px] font-bold text-terminal-950">
                  {watchlist.length}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 sm:block">
                  {user.name}
                </span>
                <button type="button" onClick={logout} className="btn-ghost hidden px-3 py-1.5 sm:inline-flex">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden px-3 py-1.5 sm:inline-flex">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary hidden px-3 py-1.5 sm:inline-flex">
                  Sign up
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <SearchBar />
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-slate-800 py-3 lg:hidden">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {!user && (
              <div className="mt-2 flex gap-2">
                <Link to="/login" className="btn-ghost flex-1">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary flex-1">
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>

      {tickerItems.length > 0 && (
        <div className="border-t border-slate-800/60 bg-terminal-900/60">
          <div className="mx-auto flex max-w-7xl items-center overflow-hidden px-4">
            <span className="flex shrink-0 items-center gap-1 py-1.5 pr-3 text-[11px] font-bold uppercase tracking-wider text-sky-400">
              Market
              <Help text="Live index levels for major Indian benchmarks, updating with simulated T-1 data." iconSize="h-3 w-3" />
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div className="flex w-max animate-ticker gap-8 py-1.5">
                {[...tickerItems, ...tickerItems].map((ix, i) => (
                  <span key={`${ix.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap font-mono text-xs">
                    <span className="text-slate-400">{ix.name}</span>
                    <span className="text-slate-100">{formatNumber(ix.value, 2)}</span>
                    <span className={changeClass(ix.changePct)}>
                      {ix.changePct > 0 ? '▲' : ix.changePct < 0 ? '▼' : ''} {Math.abs(ix.changePct)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
