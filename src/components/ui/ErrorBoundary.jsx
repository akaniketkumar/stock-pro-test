import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[StockPro] Rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15">
            <svg className="h-7 w-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <h1 className="text-xl font-bold text-slate-100">Detailed data not available for this stock yet</h1>
          <p className="max-w-sm text-sm text-slate-500">
            Something went wrong while loading this page. The data for this ticker may be incomplete. Please try another
            stock or come back later.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => this.setState({ hasError: false })} className="btn-ghost">
              Try again
            </button>
            <Link to="/" className="btn-primary">
              Go Back
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
