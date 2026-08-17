import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function Footer() {
  const { isPremium } = useApp()

  // 🚀 PRO FIX: Ek function jo "Coming Soon" ka message dega un pages ke liye jo abhi nahi bane hain
  const handleComingSoon = (e) => {
    e.preventDefault();
    alert('This feature is currently under development and will be available soon! 🚀');
  }

  return (
    <footer className="border-t border-slate-800 bg-terminal-950">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand & Description */}
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-600">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-6 4 4 8-9" />
                </svg>
              </span>
              <span className="font-extrabold text-white">
                Stock<span className="text-sky-400">Pro</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Pro-grade stock analysis, forensic red-flag screening and AI conviction for Indian markets. Built for
              beginers, powered for professionals.
            </p>
            {isPremium && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.285-3.958a1 1 0 00-.363-1.118L2.71 9.385c-.784-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.639-3.958z" />
                </svg>
                Premium Member
              </span>
            )}
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/screener" className="hover:text-slate-300 transition-colors">Stock Screener</Link></li>
              <li><Link to="/premium" className="hover:text-slate-300 transition-colors">Premium Insights</Link></li>
              <li><Link to="/ipos" className="hover:text-slate-300 transition-colors">IPO Watch</Link></li>
              <li><Link to="/" className="hover:text-slate-300 transition-colors">Market Overview</Link></li>
            </ul>
          </div>

          {/* 🚀 PRO FIX: Changed useless span tags to actual clickable links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300">Resources</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <a href="#" onClick={handleComingSoon} className="hover:text-slate-300 transition-colors">AI Conviction Methodology</a>
              </li>
              <li>
                <a href="#" onClick={handleComingSoon} className="hover:text-slate-300 transition-colors">16-Point Forensic Check</a>
              </li>
              <li>
                <Link to="/index/NIFTY50" className="hover:text-slate-300 transition-colors">Nifty 50 Watchlist</Link>
              </li>
              <li>
                <a href="#" onClick={handleComingSoon} className="hover:text-slate-300 transition-colors">Help Centre</a>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300">Disclaimer</h4>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Data shown is simulated for demonstration. StockPro does not provide investment advice. Markets are
              volatile; invest at your own risk after consulting a SEBI-registered advisor.
            </p>
          </div>

        </div>
        <div className="mt-8 border-t border-slate-800 pt-5 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} StockPro Technologies · Live Architecture
        </div>
      </div>
    </footer>
  )
}
