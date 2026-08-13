import { useEffect, useMemo, useRef, useState } from 'react'
import Help from '../ui/Help'

const UP = '#34d399'
const DOWN = '#fb7185'

function computeSMA(candles, period) {
  const sma = []
  for (let i = 0; i < candles.length; i += 1) {
    if (i < period - 1) {
      sma.push(null)
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j += 1) sum += candles[j].close
    sma.push(sum / period)
  }
  return sma
}

export default function CandleChart({ candles, height = 380 }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(760)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const [hover, setHover] = useState(null)

  const layout = useMemo(() => {
    if (!candles || candles.length === 0) return null
    const PAD_L = 10
    const PAD_R = 58
    const PAD_T = 12
    const PAD_B = 8
    const VOL_H = 64
    const plotH = height - PAD_T - PAD_B - VOL_H

    let min = Infinity
    let max = -Infinity
    let maxVol = 0
    for (const c of candles) {
      if (c.low < min) min = c.low
      if (c.high > max) max = c.high
      if (c.volume > maxVol) maxVol = c.volume
    }
    const range = max - min || 1
    min = min - range * 0.06
    max = max + range * 0.06

    const bw = width - PAD_L - PAD_R
    const step = bw / candles.length
    const cw = Math.max(1.5, Math.min(9, step * 0.62))

    const y = (v) => PAD_T + plotH - ((v - min) / (max - min)) * plotH
    const yv = (v) => PAD_T + plotH + VOL_H * 0.08 + VOL_H * 0.84 * (1 - v / maxVol)

    const ticks = []
    const tickCount = 5
    for (let i = 0; i <= tickCount; i += 1) {
      const val = min + ((max - min) * i) / tickCount
      ticks.push({ y: y(val), label: val.toFixed(0) })
    }

    const sma20 = computeSMA(candles, 20)
    const sma50 = computeSMA(candles, 50)

    const smaPath = (arr, color, useFirstNull = false) => {
      let d = ''
      let started = false
      arr.forEach((v, i) => {
        if (v === null || v === undefined) return
        const x = PAD_L + step * i + step / 2
        const yy = y(v)
        if (!started) {
          if (!useFirstNull) started = true
          d += `M${x},${yy}`
        } else {
          d += `L${x},${yy}`
        }
        started = true
      })
      return d ? <path d={d} fill="none" stroke={color} strokeWidth="1.4" /> : null
    }

    return { candles, PAD_L, PAD_R, PAD_T, plotH, VOL_H, step, cw, y, yv, min, max, maxVol, bw, ticks, sma20, sma50, smaPath }
  }, [candles, width, height])

  if (!layout) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">No chart data available.</div>
  }

  const { PAD_L, PAD_T, step, cw, y, yv, ticks, sma20, sma50, smaPath } = layout

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const idx = Math.max(0, Math.min(layout.candles.length - 1, Math.floor((x - PAD_L) / step)))
    setHover(idx)
  }

  const hoverCandle = hover !== null ? layout.candles[hover] : null
  const hoverX = hover !== null ? PAD_L + step * hover + step / 2 : 0

  return (
    <div ref={wrapRef} className="relative w-full select-none overflow-hidden">
      <svg width={width} height={height} className="block" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t.y}>
            <line x1={PAD_L} x2={width - 58} y1={t.y} y2={t.y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
            <text x={width - 52} y={t.y + 3} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {t.label}
            </text>
          </g>
        ))}

        {layout.candles.map((c, i) => {
          const x = PAD_L + step * i + step / 2
          const up = c.close >= c.open
          const color = up ? UP : DOWN
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1" />
              <rect
                x={x - cw / 2}
                y={Math.min(y(c.open), y(c.close))}
                width={cw}
                height={Math.max(1.2, Math.abs(y(c.open) - y(c.close)))}
                fill={color}
                opacity="0.92"
              />
              <rect x={x - cw / 2} y={yv(c.volume)} width={cw} height={Math.max(1, layout.PAD_T + layout.plotH + layout.VOL_H * 0.08 + layout.VOL_H * 0.84 - yv(c.volume))} fill={color} opacity="0.22" />
            </g>
          )
        })}

        {smaPath(sma20, '#38bdf8')}
        {smaPath(sma50, '#a78bfa')}

        {hoverCandle && (
          <g>
            <line x1={hoverX} x2={hoverX} y1={layout.PAD_T} y2={height - layout.PAD_B} stroke="#334155" strokeWidth="1" />
          </g>
        )}
      </svg>

      {hoverCandle && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-slate-700 bg-terminal-900/95 px-3 py-2 font-mono text-[11px] shadow-xl"
          style={{ left: Math.min(Math.max(hoverX, 90), width - 90), top: 8 }}
        >
          <div className="mb-1 text-slate-400">{hoverCandle.date}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300">
            <span className="text-slate-500">O</span>
            <span className={hoverCandle.open >= hoverCandle.close ? 'text-rose-400' : 'text-emerald-400'}>{hoverCandle.open.toFixed(2)}</span>
            <span className="text-slate-500">H</span>
            <span className="text-slate-300">{hoverCandle.high.toFixed(2)}</span>
            <span className="text-slate-500">L</span>
            <span className="text-slate-300">{hoverCandle.low.toFixed(2)}</span>
            <span className="text-slate-500">C</span>
            <span className={hoverCandle.close >= hoverCandle.open ? 'text-emerald-400' : 'text-rose-400'}>{hoverCandle.close.toFixed(2)}</span>
          </div>
          <div className="mt-1 border-t border-slate-800 pt-1 text-slate-400">Vol {hoverCandle.volume.toLocaleString('en-IN')}</div>
        </div>
      )}

      <div className="flex items-center gap-4 px-1 pb-1 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-4 rounded bg-sky-400" /> SMA 20
          <Help text="20-day moving average of closing prices — a short-term trend line." iconSize="h-3 w-3" />
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-4 rounded bg-violet-400" /> SMA 50
          <Help text="50-day moving average of closing prices — a medium-term trend line." iconSize="h-3 w-3" />
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Bullish
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-rose-400" /> Bearish
        </span>
      </div>
    </div>
  )
}
