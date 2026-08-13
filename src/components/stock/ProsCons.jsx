export default function ProsCons({ stock }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Company Strengths / Positives
        </h3>
        <ul className="space-y-2.5">
          {(stock.pros || []).map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-rose-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Company Weaknesses / Negatives
        </h3>
        <ul className="space-y-2.5">
          {(stock.cons || []).map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
                <svg className="h-3 w-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
