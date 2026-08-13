import { useMemo, useState } from 'react'

const COLORS = {
  promoters: '#38bdf8',
  fii: '#a78bfa',
  dii: '#fbbf24',
  publicHolding: '#34d399',
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const large = endAngle - startAngle > Math.PI ? 1 : 0
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

export default function HoldingPie({ data, pledge }) {
  const [active, setActive] = useState(null)

  const segments = useMemo(() => {
    const items = [
      { key: 'promoters', label: 'Promoters', value: data.promoters || 0, color: COLORS.promoters },
      { key: 'fii', label: 'FII', value: data.fii || 0, color: COLORS.fii },
      { key: 'dii', label: 'DII', value: data.dii || 0, color: COLORS.dii },
      { key: 'publicHolding', label: 'Public', value: data.publicHolding || 0, color: COLORS.publicHolding },
    ]
    const total = items.reduce((s, i) => s + i.value, 0) || 1
    let angle = -Math.PI / 2
    return items.map((item) => {
      const sweep = (item.value / total) * Math.PI * 2
      const seg = { ...item, start: angle, end: angle + sweep, pct: Math.round((item.value / total) * 1000) / 10 }
      angle += sweep
      return seg
    })
  }, [data])

  const center = 110
  const radius = 82
  const hovered = segments.find((s) => s.key === active)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 220 220" className="h-48 w-48 shrink-0">
        {segments.map((seg) => (
          <path
            key={seg.key}
            d={arcPath(center, center, radius, seg.start, seg.end)}
            fill={seg.color}
            opacity={active && active !== seg.key ? 0.35 : 1}
            className="cursor-pointer transition-opacity"
            onMouseEnter={() => setActive(seg.key)}
            onMouseLeave={() => setActive(null)}
          />
        ))}
        <circle cx={center} cy={center} r={radius * 0.58} fill="#0d1220" />
        <text x={center} y={center - 6} textAnchor="middle" fill="#94a3b8" fontSize="11">
          Promoter
        </text>
        <text x={center} y={center + 12} textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="800" fontFamily="JetBrains Mono, monospace">
          {(data.promoters || 0).toFixed(1)}%
        </text>
        <text x={center} y={center + 30} textAnchor="middle" fill={pledge > 0 ? '#fb7185' : '#34d399'} fontSize="11" fontWeight="600">
          {pledge > 0 ? `Pledge ${pledge}%` : 'No Pledge'}
        </text>
      </svg>

      <div className="grid w-full max-w-[240px] gap-2">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
              active === seg.key ? 'border-slate-600 bg-terminal-800' : 'border-slate-800 bg-terminal-900/40'
            }`}
            onMouseEnter={() => setActive(seg.key)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="flex items-center gap-2 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
              {seg.label}
            </span>
            <span className="font-mono text-slate-100">{seg.pct}%</span>
          </div>
        ))}
        {pledge > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {pledge}% of promoter shares are pledged — a key risk indicator.
          </div>
        )}
      </div>
      {hovered && (
        <div className="text-xs text-slate-500">
          {hovered.label}: {hovered.value}%
        </div>
      )}
    </div>
  )
}
