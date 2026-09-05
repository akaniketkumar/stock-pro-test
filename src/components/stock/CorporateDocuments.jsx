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

function DocumentRow({ date, title, tag, tagColor }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/50 py-3 transition-colors hover:bg-terminal-800/30">
      <span className="font-mono text-xs text-slate-500">{date}</span>
      <span className="min-w-0 flex-1 truncate pl-2 text-sm text-slate-200">{title}</span>
      {tag && <span className={`chip ${tagColor || 'bg-slate-800 text-slate-400'}`}>{tag}</span>}
      <svg className="h-3.5 w-3.5 shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </li>
  )
}

function EmptyState({ label }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
      No {label} available here — this isn't a live regulatory feed.
      <br />
      Use the "View real filings on NSE" link above for the company's actual {label.toLowerCase()}.
    </div>
  )
}

export default function CorporateDocuments({ stock, data }) {
  const [tab, setTab] = useState('announcements')
  if (!data) return null
  const nseLink = `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(stock?.symbol || '')}`
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          StockPro doesn't have a live filings feed for this section.
        </p>
        <a
          href={nseLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 whitespace-nowrap rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
        >
          View real filings on NSE →
        </a>
      </div>
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
            Regulatory filings and announcements filed with the exchange.
            <Help text="Official disclosures a listed company must file with stock exchanges." />
          </p>
          <ul className="rounded-xl border border-slate-800">
            {data.announcements.length === 0 ? (
              <EmptyState label="Announcements" />
            ) : (
              data.announcements.map((a, i) => (
                <DocumentRow key={i} date={formatDate(a.date)} title={a.title} tag={a.type} tagColor={TYPE_COLORS[a.type]} />
              ))
            )}
          </ul>
        </div>
      )}

      {tab === 'annualReports' && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            Full-year annual reports available as downloadable PDFs.
            <Help text="Audited financial statements and management discussion published each year." />
          </p>
          <ul className="rounded-xl border border-slate-800">
            {data.annualReports.length === 0 ? (
              <EmptyState label="Annual Reports" />
            ) : (
              data.annualReports.map((r, i) => (
                <DocumentRow key={i} date={`FY ${r.year.slice(2)}`} title={r.title} tag="PDF" />
              ))
            )}
          </ul>
        </div>
      )}

      {tab === 'ratings' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            Credit ratings from independent rating agencies.
            <Help text="An agency's opinion on the company's ability to repay debt. AAA is the highest grade." />
          </p>
          {data.ratings.length === 0 ? (
            <div className="sm:col-span-2"><EmptyState label="Credit Ratings" /></div>
          ) : (
            data.ratings.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-800 bg-terminal-900/40 px-4 py-3.5">
              <div>
                <div className="text-sm font-semibold text-slate-100">{r.agency}</div>
                <div className="text-[11px] text-slate-500">{formatDate(r.date)}</div>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-extrabold text-emerald-400">{r.rating}</span>
                <div className="text-[11px] text-slate-400">Outlook: {r.outlook}</div>
              </div>
            </div>
            ))
          )}
        </div>
      )}

      {tab === 'concalls' && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            Earnings call transcripts and audio recordings for recent quarters.
            <Help text="Management discussions with analysts after quarterly results." />
          </p>
          <ul className="rounded-xl border border-slate-800">
            {data.concalls.length === 0 ? (
              <EmptyState label="Earnings Calls" />
            ) : (
              data.concalls.map((c, i) => (
                <li key={i} className="border-b border-slate-800/50 py-3 transition-colors last:border-0 hover:bg-terminal-800/30">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4">
                    <div>
                      <span className="font-mono text-sm font-semibold text-slate-100">{c.quarter}</span>
                      <span className="ml-2 font-mono text-xs text-slate-500">{formatDate(c.date)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="chip bg-violet-500/10 text-violet-300">{c.transcript}</span>
                      <span className="chip bg-slate-800 text-slate-300">{c.audio}</span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
