import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[StockPro] Rendering error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-12 text-left">
          <div className="w-full rounded-xl border border-rose-500/50 bg-terminal-900/90 p-6 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center gap-3 border-b border-rose-500/20 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20">
                <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h1 className="text-xl font-bold text-rose-400">System Crash Intercepted!</h1>
                <p className="text-sm text-slate-300">Website ke andar ka ek component load hone mein fail ho gaya.</p>
              </div>
            </div>
            
            <p className="mb-2 text-sm font-semibold text-slate-100">Exact Error Message (Isey aniket ko bhejo):</p>
            <div className="mb-6 max-h-72 overflow-auto rounded-lg bg-black/60 p-4 font-mono text-xs leading-relaxed text-rose-300 shadow-inner">
              <p className="font-bold text-rose-200">{this.state.error && this.state.error.toString()}</p>
              <pre className="mt-3 text-slate-400 whitespace-pre-wrap">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>

            <div className="flex flex-wrap gap-4">
              <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-slate-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-600">
                Hard Refresh
              </button>
              <Link to="/" onClick={() => this.setState({ hasError: false })} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
                Go Back to Home
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
