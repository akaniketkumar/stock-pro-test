import Help from '../ui/Help'
import { changeClass } from '../../utils/format'

export default function ShareholderAnalytics({ stock, data }) {
  if (!data) return null
  const { shareholders, holdings, pledge } = data
  const latest = holdings[0]
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Total Shareholders
            <Help text="Total number of unique shareholders holding shares in the company." />
          </div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-slate-100">
            {shareholders.current.total.toLocaleString('en-IN')}
          </div>
          <div className={`mt-1 text-[11px] font-semibold ${changeClass(shareholders.current.growth)}`}>
            {shareholders.current.growth > 0 ? '+' : ''}{shareholders.current.growth}% QoQ
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Promoters
            <Help text="Percentage of the company owned by the promoters and their group." />
          </div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-400">{latest.promoters}%</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            FII + DII
            <Help text="Institutional ownership — foreign (FII) plus domestic (DII) institutional investors." />
          </div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-slate-100">{latest.fii + latest.dii}%</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Promoter Pledge
            <Help text="Share of promoter holding that is pledged as loan collateral. High pledge is a risk signal." />
          </div>
          <div className={`mt-1 font-mono text-2xl font-extrabold ${pledge > 20 ? 'text-rose-400' : pledge > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {pledge > 0 ? `${pledge}%` : 'None'}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-terminal-900/40 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Quarter</th>
              <th className="px-4 py-3 text-right font-semibold">Promoters</th>
              <th className="px-4 py-3 text-right font-semibold">FII</th>
              <th className="px-4 py-3 text-right font-semibold">DII</th>
              <th className="px-4 py-3 text-right font-semibold">Public</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.period} className="border-b border-slate-800/50 transition-colors hover:bg-terminal-800/40">
                <td className="px-4 py-2.5 font-mono text-sm font-semibold text-slate-100">{h.period}</td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-300">{h.promoters}%</td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-300">{h.fii}%</td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-300">{h.dii}%</td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-300">{h.publicHolding}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 text-[11px] text-slate-500 sm:grid-cols-3">
        <p className="rounded-lg bg-terminal-900/40 px-3 py-2">
          <span className="font-semibold text-emerald-300">↑ Rising promoter stake</span> signals long-term confidence in the business.
        </p>
        <p className="rounded-lg bg-terminal-900/40 px-3 py-2">
          <span className="font-semibold text-sky-300">Rising FII stake</span> often attracts broader institutional interest.
        </p>
        <p className="rounded-lg bg-terminal-900/40 px-3 py-2">
          <span className="font-semibold text-rose-300">Pledged shares</span> above 20% of promoter holding indicate elevated risk.
        </p>
      </div>
    </div>
  )
}
