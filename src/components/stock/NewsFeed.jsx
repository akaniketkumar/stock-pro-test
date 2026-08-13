import { useEffect, useState } from 'react'
import { getStockNews } from '../../services/api'
import Help from '../ui/Help'
import { ErrorState, Skeleton } from '../ui/Loading'

const SENTIMENT_STYLES = {
  positive: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  negative: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  neutral: 'border-slate-600 bg-slate-800/60 text-slate-300',
}

function SentimentIcon({ sentiment }) {
  if (sentiment === 'positive') {
    return (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    )
  }
  if (sentiment === 'negative') {
    return (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    )
  }
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
    </svg>
  )
}

function SentimentBadge({ sentiment }) {
  const label = sentiment === 'positive' ? 'Positive Impact' : sentiment === 'negative' ? 'Negative Impact' : 'Neutral'
  return (
    <span className={`chip shrink-0 ${SENTIMENT_STYLES[sentiment] || SENTIMENT_STYLES.neutral}`}>
      <SentimentIcon sentiment={sentiment} />
      {label}
    </span>
  )
}

export default function NewsFeed({ stockId, height = 'max-h-[460px]' }) {
  const [news, setNews] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setNews(null)
    setError(false)
    getStockNews(stockId)
      .then((res) => {
        if (!cancelled) setNews(res)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [stockId])

  if (error) return <ErrorState message="Could not load live news." />

  return (
    <div className={`overflow-hidden ${height}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">LIVE</span>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          AI-sentiment tagged feed
          <Help glossaryKey="sentiment" iconSize="h-3 w-3" />
        </span>
      </div>

      {!news && !error ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">No recent news available for this stock.</div>
      ) : (
        <ul className="space-y-3 overflow-y-auto pr-1">
          {news.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-800 bg-terminal-900/50 p-3 transition-colors hover:border-slate-700 hover:bg-terminal-800/60"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold leading-snug text-slate-100">{item.title}</h4>
                <SentimentBadge sentiment={item.sentiment} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-400">{item.source}</span>
                <span className="text-slate-600">·</span>
                <span>{item.time}</span>
                {item.tags.map((t) => (
                  <span key={t} className="chip text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
