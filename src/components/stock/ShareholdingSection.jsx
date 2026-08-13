import HoldingPie from '../charts/HoldingPie'
import Help from '../ui/Help'
import { changeClass } from '../../utils/format'

export default function ShareholdingSection({ stock }) {
  const holding = {
    promoters: stock.promoterHolding,
    fii: stock.fiiHolding,
    dii: stock.diiHolding,
    publicHolding: stock.publicHolding,
  }

  const history = stock.holdingsHistory || []

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0">
        <HoldingPie data={holding} pledge={stock.promoterPledge || 0} />
      </div>

      <div className="min-w-0">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
          Holding Trend (last 4 quarters)
          <Help text="How promoter, FII, DII and public ownership has changed over the last four quarters. Rising promoter and institutional stakes are generally positive signals." />
        </h4>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-2 font-semibold">Period</th>
                <th className="py-2 pr-2 font-semibold">
                  <span className="inline-flex items-center gap-1">Promoters<Help glossaryKey="promoterHolding" iconSize="h-3 w-3" /></span>
                </th>
                <th className="py-2 pr-2 font-semibold">
                  <span className="inline-flex items-center gap-1">FII<Help glossaryKey="fiiHolding" iconSize="h-3 w-3" /></span>
                </th>
                <th className="py-2 pr-2 font-semibold">
                  <span className="inline-flex items-center gap-1">DII<Help glossaryKey="diiHolding" iconSize="h-3 w-3" /></span>
                </th>
                <th className="py-2 font-semibold">
                  <span className="inline-flex items-center gap-1">Public<Help glossaryKey="publicHolding" iconSize="h-3 w-3" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => {
                const drift = row.promoters - holding.promoters
                return (
                  <tr key={row.period} className="border-b border-slate-800/50 font-mono text-slate-300">
                    <td className="py-2 pr-2 text-slate-400">{row.period}</td>
                    <td className={`py-2 pr-2 ${changeClass(drift)}`}>
                      {row.promoters.toFixed(1)}%
                      {drift !== 0 && <span className="ml-0.5 text-[10px]">{drift > 0 ? '+' : ''}{drift.toFixed(1)}</span>}
                    </td>
                    <td className="py-2 pr-2">{row.fii.toFixed(1)}%</td>
                    <td className="py-2 pr-2">{row.dii.toFixed(1)}%</td>
                    <td className="py-2">{row.publicHolding.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border border-slate-800 bg-terminal-900/50 p-3">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
              Promoter Pledge
              <Help glossaryKey="promoterPledge" iconSize="h-3 w-3" />
            </div>
            <div className={`mt-1 font-mono text-lg font-bold ${stock.promoterPledge > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stock.promoterPledge > 0 ? `${stock.promoterPledge}%` : 'None'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-terminal-900/50 p-3">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
              Price vs 52W High
              <Help glossaryKey="fiftyTwoWHigh" iconSize="h-3 w-3" />
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-slate-100">
              {stock.price && stock.fiftyTwoWHigh ? `${Math.max(0, ((stock.price / stock.fiftyTwoWHigh) * 100).toFixed(0))}%` : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
