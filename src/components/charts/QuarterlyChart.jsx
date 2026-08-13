import { useState } from 'react'
import Help from '../ui/Help'

export default function QuarterlyChart({ data }) {
  const [mode, setMode] = useState('profit')

  const maxProfit = Math.max(...data.map((d) => Math.abs(d.netProfit)), 1)
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const maxVal = mode === 'profit' ? maxProfit : maxRevenue

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Metric
          <Help text="Toggle between Net Profit and Revenue to compare quarterly trends." iconSize="h-3 w-3" />
        </span>
        <div className="inline-flex rounded-lg border border-slate-700 p-0.5 text-xs">
          {[
            { key: 'profit', label: 'Net Profit' },
            { key: 'revenue', label: 'Revenue' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                mode === m.key ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-56 items-end gap-4 px-2">
        {data.map((d) => {
          const val = mode === 'profit' ? d.netProfit : d.revenue
          const h = Math.max(4, (Math.abs(val) / maxVal) * 100)
          const negative = mode === 'profit' && val < 0
          return (
            <div key={d.period} className="group flex flex-1 flex-col items-center gap-2">
              <div className="flex h-44 w-full items-end justify-center">
                <div
                  className={`w-full max-w-[46px] rounded-t-md transition-all group-hover:opacity-80 ${
                    negative ? 'bg-rose-500/80' : 'bg-gradient-to-t from-sky-600 to-sky-400'
                  }`}
                  style={{ height: `${h}%` }}
                />
              </div>
              <div className="text-center">
                <div className="font-mono text-xs font-semibold text-slate-200">
                  {mode === 'profit' ? (val / 1000).toFixed(2) : (val / 1000).toFixed(0)}
                  <span className="text-[10px] font-normal text-slate-500">K Cr</span>
                </div>
                <div className="text-[10px] text-slate-500">{d.period}</div>
              </div>
            </div>
          )
        })}
      </div>

      {mode === 'profit' && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.map((d) => (
            <div key={d.period} className="rounded-lg border border-slate-800 bg-terminal-900/50 px-3 py-2 text-center">
              <div className="text-[10px] text-slate-500">{d.period}</div>
              <div className={`font-mono text-sm font-bold ${d.qoQ >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {d.qoQ >= 0 ? '+' : ''}
                {d.qoQ}%
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                QoQ change
                <Help text="Quarter-over-quarter percentage change in net profit versus the previous quarter." iconSize="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
