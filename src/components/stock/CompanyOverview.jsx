export default function CompanyOverview({ stock }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-100">
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          About Company
        </h3>
        <p className="text-sm leading-relaxed text-slate-300">{stock.about}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="chip bg-sky-500/10 text-sky-300">{stock.industry}</span>
          <span className="chip bg-slate-800 text-slate-300">{stock.sector}</span>
          <span className="chip bg-emerald-500/10 text-emerald-300">{stock.exchange}</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-100">
          <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Key Highlights
        </h3>
        <ul className="space-y-2.5">
          {(stock.keyPoints || []).map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-terminal-900/40 px-3 py-2.5 text-sm leading-relaxed text-slate-300">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
