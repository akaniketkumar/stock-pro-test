import { useState } from 'react'
import Help from '../ui/Help'

const STATUS_META = {
  pass: { icon: 'check', color: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Pass' },
  strong: { icon: 'check', color: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Pass' },
  watch: { icon: 'alert', color: 'text-amber-400', border: 'border-amber-500/30', label: 'Watch' },
  danger: { icon: 'cross', color: 'text-rose-400', border: 'border-rose-500/40', label: 'Danger' },
}

function StatusIcon({ type }) {
  if (type === 'check') {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
        <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  if (type === 'cross') {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
        <svg className="h-3.5 w-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    )
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
      <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
  )
}

function CountPill({ type, count }) {
  const meta = STATUS_META[type]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold ${meta.border} ${meta.color}`}>
      <StatusIcon type={type === 'pass' || type === 'strong' ? 'check' : type} />
      {count} {type === 'watch' ? 'Watch' : type === 'danger' ? 'Danger' : 'Pass'}
    </span>
  )
}

export default function RedFlagAnalyzer({ redFlags }) {
  const [open, setOpen] = useState(1)
  const [filter, setFilter] = useState('all')

  const results = redFlags?.results || []
  const questions = redFlags?.questions || []

  if (!results.length || !questions.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">
        The 16-point forensic report will be generated automatically once live data sources are connected.
      </div>
    )
  }

  const map = Object.fromEntries(results.map((r) => [r.id, r]))
  const counts = {
    pass: results.filter((r) => r.status === 'pass' || r.status === 'strong').length,
    watch: results.filter((r) => r.status === 'watch').length,
    danger: results.filter((r) => r.status === 'danger').length,
  }

  const categories = [...new Set(questions.map((q) => q.category))]

  const visible = (q) => {
    const res = map[q.id]
    if (filter === 'all') return true
    if (filter === 'danger' || filter === 'watch' || filter === 'pass') {
      const statusKey = res?.status === 'strong' ? 'pass' : res?.status
      return statusKey === filter
    }
    return true
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Filter
          <Help text="The 16-point forensic check examines each stock for red flags across governance, accounting quality, cash flow, pledge, related-party and valuation risks. Each check returns Pass, Watch or Danger." iconSize="h-3 w-3" />
        </span>
        {[
          { key: 'all', label: 'All' },
          { key: 'danger', label: `Danger (${counts.danger})` },
          { key: 'watch', label: `Watch (${counts.watch})` },
          { key: 'pass', label: `Pass (${counts.pass})` },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === f.key ? 'bg-sky-500 text-white' : 'border border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <CountPill type="pass" count={counts.pass} />
          <CountPill type="watch" count={counts.watch} />
          <CountPill type="danger" count={counts.danger} />
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const catQuestions = questions.filter((q) => q.category === category && visible(q))
          if (!catQuestions.length) return null
          return (
            <div key={category}>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span className="h-px w-4 bg-slate-700" />
                {category}
              </h4>
              <div className="space-y-2">
                {catQuestions.map((q) => {
                  const res = map[q.id]
                  const meta = STATUS_META[res?.status] || STATUS_META.watch
                  const isOpen = open === q.id
                  return (
                    <div
                      key={q.id}
                      className={`overflow-hidden rounded-xl border transition-colors ${meta.border} ${
                        isOpen ? 'bg-terminal-800/60' : 'bg-terminal-850 hover:bg-terminal-800/40'
                      }`}
                    >
                      <button type="button" onClick={() => setOpen(isOpen ? null : q.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                        <StatusIcon type={meta.icon} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-100">
                            <span className="mr-2 font-mono text-xs text-slate-500">{String(q.id).padStart(2, '0')}</span>
                            {q.question}
                          </div>
                          {res && res.status !== 'pass' && res.status !== 'strong' && (
                            <div className={`mt-0.5 line-clamp-1 text-xs ${meta.color}`}>{res.evidence}</div>
                          )}
                        </div>
                        <svg
                          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-800/60 bg-terminal-900/40 px-4 py-4 pl-12">
                          <p className="text-xs leading-relaxed text-slate-500">{q.detail}</p>
                          {res ? (
                            <div className="mt-3">
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Auto-evaluation</div>
                              <p className="text-sm leading-relaxed text-slate-300">{res.evidence}</p>
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-500">Evaluation pending data availability.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
