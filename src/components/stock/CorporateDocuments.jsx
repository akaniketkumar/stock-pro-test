import { useState } from 'react'
import Help from '../ui/Help'

const TABS = [
  { key: 'announcements', label: 'Announcements' },
  { key: 'annualReports', label: 'Annual Reports' },
  { key: 'ratings', label: 'Credit Ratings' },
  { key: 'concalls', label: 'Earnings Calls' },
]

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const TYPE_COLORS = {
  Results: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  Dividend: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  Concall: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  'Credit Rating': 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  Subsidiary: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
  Buyback: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  Shareholding: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  Clarification: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
}

function DocumentRow({ title, link }) {
  return (
    <li className="border-b border-slate-800/50 last:border-0">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 transition-colors hover:bg-terminal-800/30"
      >
        <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{title}</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-sky-400">
          Open on NSE
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </span>
      </a>
    </li>
  )
}

export default function CorporateDocuments({ stock, data }) {
  const [tab, setTab] = useState('announcements')
  if (!data) return null
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                : 'border-slate-800 bg-terminal-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'announcements' && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            Opens NSE's own real, live announcements page for this company.
            <Help text="Official disclosures a listed company must file with stock exchanges." />
          </p>
          <ul className="rounded-xl border border-slate-800">
            {data.announcements.map((a, i) => (
              <DocumentRow key={i} title={a.title} link={a.link} />
            ))}
          </ul>
        </div>
      )}

      {tab === 'annualReports' && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            Opens NSE's real financial-results filings page for this company.
            <Help text="Audited financial statements and management discussion published each year." />
          </p>
          <ul className="rounded-xl border border-slate-800">
            {data.annualReports.map((r, i) => (
              <DocumentRow key={i} title={r.title} link={r.link} />
            ))}
          </ul>
        </div>
      )}

      {tab === 'ratings' && (
        <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-8 text-center text-sm text-slate-500">
          Credit ratings aren't available from any free source we can rely on, so we don't show invented ratings here.
          Check the company's investor-relations page or a rating agency's site (ICRA, CRISIL, CARE, India Ratings) directly.
        </div>
      )}

      {tab === 'concalls' && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            Opens NSE's announcements page, where investor presentations and concall material are usually filed.
            <Help text="Management discussions with analysts after quarterly results." />
          </p>
          <ul className="rounded-xl border border-slate-800">
            {data.concalls.map((c, i) => (
              <DocumentRow key={i} title={c.transcript} link={c.link} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
