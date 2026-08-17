import { useState } from 'react'
import HoldingPie from '../charts/HoldingPie'
import Help from '../ui/Help'
import { changeClass } from '../../utils/format'

export default function ShareholdingSection({ stock }) {
  const [viewMode, setViewMode] = useState('quarterly') // 'quarterly' or 'yearly'

  const holding = {
    promoters: stock.promoterHolding || 0,
    fii: stock.fiiHolding || 0,
    dii: stock.diiHolding || 0,
    publicHolding: stock.publicHolding || 0,
  }

  // Fallback data for last 5 years if yearly data is not yet in mock
  const defaultYearlyHistory = [
    { period: 'FY26', promoters: holding.promoters, fii: holding.fii, dii: holding.dii, publicHolding: holding.publicHolding },
    { period: 'FY25', promoters: holding.promoters - 0.2, fii: holding.fii + 0.4, dii: holding.dii - 0.3, publicHolding: holding.publicHolding + 0.1 },
    { period: 'FY24', promoters: holding.promoters - 0.5, fii: holding.fii + 0.8, dii: holding.dii - 0.6, publicHolding: holding.publicHolding + 0.3 },
    { period: 'FY23', promoters: holding.promoters - 0.8, fii: holding.fii + 1.2, dii: holding.dii - 0.9, publicHolding: holding.publicHolding + 0.5 },
    { period: 'FY22', promoters: holding.promoters - 1.1, fii: holding.fii + 1.5, dii: holding.dii - 1.2, publicHolding: holding.publicHolding + 0.8 },
  ]

  const history = viewMode === 'quarterly' 
    ? (stock.holdingsHistory || []) 
    : (stock.yearlyHoldingsHistory || defaultYearlyHistory)

  return (
    // 🚀 PRO FIX: Replaced unstable Grid with a rock-solid Flexbox layout
    <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between w-full">
      
      {/* Left Side: Pie Chart - Restricted Width */}
      <div className="w-full lg:w-5/12 flex justify-center items-center flex-shrink-0">
        <div className="w-full max-w-[400px]">
          <HoldingPie data={holding} pledge={stock.promoterPledge || 0} />
        </div>
      </div>

      {/* Right Side: Trend Table & Cards - Flexible Width */}
      <div className="w-full lg:w-7/12 min-w-0 flex-1">
        
        {/* Header Section (Title + Toggle Button) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-200">
            Holding Trend ({viewMode === 'quarterly' ? 'Last 4 Quarters' : 'Last 5 Years'})
            <Help text="Track how promoter, FII, DII and public ownership has changed over quarters or full financial years." />
          </h4>

          {/* Toggle Button for Quarterly vs Yearly */}
          <div className="inline-flex rounded-lg border border-slate-800 bg-terminal-900/80 p-0.5 flex-shrink-0 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('quarterly')}
              className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-all ${
                viewMode === 'quarterly'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Quarterly
            </button>
            <button
              type="button"
              onClick={() => setViewMode('yearly')}
              className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-all ${
                viewMode === 'yearly'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yearly (5Y)
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="w-full overflow-x-auto rounded-xl border border-slate-800 shadow-sm">
          <table className="w-full min-w-[450px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/20 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 pl-4 pr-2 font-semibold">Period</th>
                <th className="py-3 pr-2 font-semibold">
                  <span className="inline-flex items-center gap-1">Promoters<Help glossaryKey="promoterHolding" iconSize="h-3 w-3" /></span>
                </th>
                <th className="py-3 pr-2 font-semibold">
                  <span className="inline-flex items-center gap-1">FII<Help glossaryKey="fiiHolding" iconSize="h-3 w-3" /></span>
                </th>
                <th className="py-3 pr-2 font-semibold">
                  <span className="inline-flex items-center gap-1">DII<Help glossaryKey="diiHolding" iconSize="h-3 w-3" /></span>
                </th>
                <th className="py-3 pr-4 font-semibold">
                  <span className="inline-flex items-center gap-1">Public<Help glossaryKey="publicHolding" iconSize="h-3 w-3" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => {
                const drift = row.promoters - holding.promoters
                return (
                  <tr key={row.period} className="border-b border-slate-800/50 font-mono text-slate-300 hover:bg-slate-800/10 transition-colors">
                    <td className="py-2.5 pl-4 pr-2 text-slate-400 font-semibold">{row.period}</td>
                    <td className={`py-2.5 pr-2 flex items-center gap-1 ${changeClass(drift)}`}>
                      {row.promoters ? row.promoters.toFixed(1) : '0.0'}%
                      {drift !== 0 && (
                        <span className="inline-block text-[10px] bg-slate-800/50 px-1 rounded">
                          {drift > 0 ? '+' : ''}{drift.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-2">{row.fii ? row.fii.toFixed(1) : '0.0'}%</td>
                    <td className="py-2.5 pr-2">{row.dii ? row.dii.toFixed(1) : '0.0'}%</td>
                    <td className="py-2.5 pr-4">{row.publicHolding ? row.publicHolding.toFixed(1) : '0.0'}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Metrics Cards */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-3.5 transition-colors hover:bg-terminal-900/60">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
              Promoter Pledge
              <Help glossaryKey="promoterPledge" iconSize="h-3.5 w-3.5" />
            </div>
            <div className={`mt-1.5 font-mono text-xl font-bold ${stock.promoterPledge > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stock.promoterPledge > 0 ? `${stock.promoterPledge}%` : 'None'}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-3.5 transition-colors hover:bg-terminal-900/60">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
              Price vs 52W High
              <Help glossaryKey="fiftyTwoWHigh" iconSize="h-3.5 w-3.5" />
            </div>
            <div className="mt-1.5 font-mono text-xl font-bold text-slate-100">
              {stock.price && stock.fiftyTwoWHigh ? `${Math.max(0, ((stock.price / stock.fiftyTwoWHigh) * 100).toFixed(0))}%` : '—'}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
