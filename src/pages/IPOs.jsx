import { useEffect, useState } from 'react'
import { getIPOs } from '../services/api'
import SectionTitle from '../components/ui/SectionTitle'
import Help from '../components/ui/Help'
import { Spinner } from '../components/ui/Loading'

const STATUS_STYLES = {
  Open: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  Upcoming: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  Listed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
}

function IpoCard({ ipo }) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100">{ipo.name}</h3>
          <div className="mt-1 text-xs text-slate-500">
            {ipo.ticker} · {ipo.sector}
          </div>
        </div>
        <span className={`chip ${STATUS_STYLES[ipo.status] || ''}`}>{ipo.status}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-terminal-900/50 p-2.5">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
            Price Band
            <Help text="The lower and upper price at which you can apply for the IPO shares. The final allotment price is set within this band." iconSize="h-3 w-3" />
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-slate-100">
            ₹{ipo.priceBand.low}–{ipo.priceBand.high}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-terminal-900/50 p-2.5">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
            Lot Size
            <Help glossaryKey="lotSize" iconSize="h-3 w-3" />
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-slate-100">{ipo.lotSize}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-terminal-900/50 p-2.5">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
            Issue Size
            <Help glossaryKey="issueSize" iconSize="h-3 w-3" />
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-slate-100">{ipo.issueSizeLabel}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-terminal-900/50 p-2.5">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
            {ipo.status === 'Listed' ? 'List Price' : 'GMP'}
            {ipo.status === 'Listed' ? (
              <Help text="The price at which the IPO shares opened on the stock exchange on listing day." iconSize="h-3 w-3" />
            ) : (
              <Help glossaryKey="gmp" iconSize="h-3 w-3" />
            )}
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-slate-100">
            {ipo.status === 'Listed' ? (ipo.listingPrice ? `₹${ipo.listingPrice.toLocaleString('en-IN')}` : '—') : ipo.gmp != null ? `₹${ipo.gmp}` : '—'}
          </div>
        </div>
      </div>

      {ipo.status === 'Listed' && ipo.currentPrice != null && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <span className="text-xs text-slate-400">Current price</span>
          <span className="font-mono text-sm font-bold text-emerald-400">₹{ipo.currentPrice.toLocaleString('en-IN')}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-500">
        <span>
          {ipo.status === 'Open'
            ? `Closes ${ipo.closeDate}`
            : ipo.status === 'Upcoming'
              ? `Opens ${ipo.openDate}`
              : `Listed ${ipo.listingDate}`}
        </span>
        <span className="font-semibold text-slate-400">{ipo.type}</span>
      </div>

      {ipo.subscription && (
        <div className="mt-3 space-y-1.5 rounded-lg border border-slate-800 bg-terminal-900/50 p-3">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Subscription
            <Help glossaryKey="subscription" iconSize="h-3 w-3" />
          </div>
          {[
            { label: 'Retail', value: ipo.subscription.retail },
            { label: 'QIB', value: ipo.subscription.qib },
            { label: 'NII', value: ipo.subscription.nii },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-10 text-[11px] text-slate-500">{row.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                  style={{ width: `${Math.min(100, (row.value || 0) * 12)}%` }}
                />
              </div>
              <span className="w-12 text-right font-mono text-[11px] text-slate-300">{row.value != null ? `${row.value}x` : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function IPOs() {
  const [ipos, setIpos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getIPOs()
      .then((data) => {
        setIpos(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading IPOs..." className="py-32" />

  const open = ipos.filter((i) => i.status === 'Open')
  const upcoming = ipos.filter((i) => i.status === 'Upcoming')
  const listed = ipos.filter((i) => i.status === 'Listed')

  const Section = ({ title, count, items }) =>
    items.length > 0 && (
      <section>
        <SectionTitle title={title} right={<span className="font-mono text-xs font-bold text-sky-400">{count}</span>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ipo) => (
            <IpoCard key={ipo.id} ipo={ipo} />
          ))}
        </div>
      </section>
    )

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">IPO Watch</h1>
        <p className="mt-1 text-sm text-slate-400">Live and upcoming public issues on NSE with GMP, lot size and subscription data.</p>
      </div>

      <Section title="Currently Open" count={open.length} items={open} />
      <Section title="Upcoming" count={upcoming.length} items={upcoming} />
      <Section title="Recently Listed" count={listed.length} items={listed} />

      <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-4 text-xs text-slate-500">
        GMP data is indicative and simulated for demo purposes. Always verify from a SEBI-registered intermediary before applying.
      </div>
    </div>
  )
}
