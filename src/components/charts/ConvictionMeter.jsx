import { useState } from 'react'
import Help from '../ui/Help'

const BANDS = [
  { min: 75, label: 'Strong Bullish', color: '#34d399' },
  { min: 60, label: 'Bullish', color: '#38bdf8' },
  { min: 45, label: 'Neutral', color: '#94a3b8' },
  { min: 30, label: 'Bearish', color: '#fbbf24' },
  { min: 0, label: 'Strong Bearish', color: '#fb7185' },
]

function bandColor(score) {
  for (const b of BANDS) if (score >= b.min) return b.color
  return '#fb7185'
}

function bandLabel(score) {
  for (const b of BANDS) if (score >= b.min) return b.label
  return 'Strong Bearish'
}

function PolarIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 4a6 6 0 00-6 6h6V6z" />
    </svg>
  )
}

export default function ConvictionMeter({ conviction }) {
  const [tab, setTab] = useState('thesis')
  const score = conviction?.score ?? 50
  const color = bandColor(score)
  const label = conviction?.label || bandLabel(score)

  const arc = Math.PI
  const angle = (score / 100) * arc
  const cx = 90
  const cy = 90
  const r = 72

  function polar(cxr, cyr, rr, a) {
    return [cxr + rr * Math.cos(Math.PI - a), cyr - rr * Math.sin(Math.PI - a)]
  }

  const [sx, sy] = polar(cx, cy, r, 0)
  const [ex, ey] = polar(cx, cy, r, angle)
  const largeArc = angle > Math.PI / 2 ? 1 : 0

  const tabs = [
    { key: 'thesis', label: 'Why is it moving?' },
    { key: 'reasons', label: 'Bull logic' },
    { key: 'risks', label: 'Bear risks' },
  ]

  return (
    <div>
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <div className="relative shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <path d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`} stroke="#1e293b" strokeWidth="14" fill="none" strokeLinecap="round" />
            <path
              d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
              stroke={color}
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            {BANDS.filter((b) => b.min > 0 && b.min < 100).map((b) => {
              const a = (b.min / 100) * arc
              const [tx, ty] = polar(cx, cy, r + 16, a)
              return (
                <text key={b.label} x={tx} y={ty} textAnchor="middle" fill="#475569" fontSize="9">
                  {b.min}
                </text>
              )
            })}
            <text x="90" y="85" textAnchor="middle" className="font-mono" fill="#e2e8f0" fontSize="30" fontWeight="800">
              {score}
            </text>
            <text x="90" y="108" textAnchor="middle" fill="#64748b" fontSize="10">
              conviction score
            </text>
          </svg>
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 translate-y-[42px] items-center gap-1.5">
            <div
              className="rounded-full px-3 py-1 text-xs font-bold text-terminal-950"
              style={{ backgroundColor: color }}
            >
              {label}
            </div>
            <Help glossaryKey="conviction" />
          </div>
        </div>

        <div className="w-full flex-1">
          <div className="mb-4 inline-flex rounded-lg border border-slate-700 p-0.5 text-xs">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                  tab === t.key ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'thesis' && (
            <div className="rounded-xl border border-slate-800 bg-terminal-900/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-400">
                <PolarIcon className="h-4 w-4" />
                AI Thesis
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{conviction?.thesis}</p>
            </div>
          )}

          {tab === 'reasons' && (
            <ul className="space-y-2">
              {(conviction?.reasons || []).map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          )}

          {tab === 'risks' && (
            <ul className="space-y-2">
              {(conviction?.risks || []).map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
                    <svg className="h-3 w-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
