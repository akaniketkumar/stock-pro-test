import QuarterlyChart from '../charts/QuarterlyChart'
import Help from '../ui/Help'
import { formatCompact } from '../../utils/format'

export default function QuarterlySection({ stock }) {
  const rows = stock.quarterly || []

  return (
    <div>
      <QuarterlyChart data={rows} />
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2.5 pr-4 font-semibold">Quarter</th>
              <th className="py-2.5 pr-4 font-semibold">
                <span className="inline-flex items-center gap-1">Revenue<Help glossaryKey="revenue" iconSize="h-3 w-3" /></span>
              </th>
              <th className="py-2.5 pr-4 font-semibold">
                <span className="inline-flex items-center gap-1">Net Profit<Help glossaryKey="netProfit" iconSize="h-3 w-3" /></span>
              </th>
              <th className="py-2.5 pr-4 font-semibold">Margin</th>
              <th className="py-2.5 font-semibold">
                <span className="inline-flex items-center gap-1">Profit QoQ<Help glossaryKey="profitQtrGrowth" iconSize="h-3 w-3" /></span>
              </th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((row) => (
              <tr key={row.period} className="border-b border-slate-800/50 text-slate-300">
                <td className="py-2.5 pr-4 text-slate-400">{row.period}</td>
                <td className="py-2.5 pr-4">{formatCompact(row.revenue)}</td>
                <td className={`py-2.5 pr-4 ${row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCompact(row.netProfit)}
                </td>
                <td className="py-2.5 pr-4">{row.margin}%</td>
                <td className={`py-2.5 ${row.qoQ >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {row.qoQ >= 0 ? '+' : ''}
                  {row.qoQ}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
