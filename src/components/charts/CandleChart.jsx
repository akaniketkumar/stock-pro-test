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

// Classic Wilder RSI-14, computed from the same closes driving the chart —
// used to draw the area indicator strip under the price panel.
function computeRSISeries(candles, period = 14) {
  const out = new Array(candles.length).fill(null)
  if (candles.length < period + 1) return out
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i += 1) {
    const diff = candles[i].close - candles[i - 1].close
    if (diff > 0) avgGain += diff
    else avgLoss -= diff
  }
  avgGain /= period
  avgLoss /= period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  for (let i = period + 1; i < candles.length; i += 1) {
    const diff = candles[i].close - candles[i - 1].close
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

export default function CandleChart({ candles, height = 380 }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(760)
  const [chartType, setChartType] = useState('candle') // 'candle' | 'line'
  const [showRSI, setShowRSI] = useState(true)

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
    const VOL_H = 56
    const RSI_H = showRSI ? 64 : 0
    const RSI_GAP = showRSI ? 14 : 0
    const plotH = height - PAD_T - PAD_B - VOL_H - RSI_H - RSI_GAP

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
    const volTop = PAD_T + plotH
    const yv = (v) => volTop + VOL_H * 0.1 + VOL_H * 0.8 * (1 - v / (maxVol || 1))

    const rsiTop = volTop + VOL_H + RSI_GAP
    const yr = (v) => rsiTop + RSI_H * (1 - v / 100)

    const ticks = []
    const tickCount = 5
    for (let i = 0; i <= tickCount; i += 1) {
      const val = min + ((max - min) * i) / tickCount
      ticks.push({ y: y(val), label: val.toFixed(0) })
    }

    const sma20 = computeSMA(candles, 20)
    const sma50 = computeSMA(candles, 50)
    const rsiSeries = showRSI ? computeRSISeries(candles, 14) : []

    const linePath = (getX, getY, values) => {
      let d = ''
      let started = false
      values.forEach((v, i) => {
        if (v === null || v === undefined) return
        const x = getX(i)
        const yy = getY(v)
        d += started ? `L${x},${yy}` : `M${x},${yy}`
        started = true
      })
      return d
    }

    const xAt = (i) => PAD_L + step * i + step / 2
    const smaPath = (arr, color) => {
      const d = linePath(xAt, y, arr)
      return d ? <path d={d} fill="none" stroke={color} strokeWidth="1.4" /> : null
    }

    const closes = candles.map((c) => c.close)
    const closeLineD = linePath(xAt, y, closes)
    const closeAreaD = closeLineD ? `${closeLineD} L${xAt(candles.length - 1)},${volTop} L${xAt(0)},${volTop} Z` : ''

    const rsiLineD = showRSI ? linePath(xAt, yr, rsiSeries) : ''
    const rsiAreaD = rsiLineD ? `${rsiLineD} L${xAt(candles.length - 1)},${rsiTop + RSI_H} L${xAt(0)},${rsiTop + RSI_H} Z` : ''

    return {
      candles, PAD_L, PAD_R, PAD_T, plotH, VOL_H, RSI_H, rsiTop, step, cw, y, yv, yr, min, max, maxVol, bw, ticks,
      sma20, sma50, smaPath, closeLineD, closeAreaD, rsiLineD, rsiAreaD, xAt, volTop,
    }
  }, [candles, width, height, showRSI])

  if (!layout) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">No chart data available.</div>
  }

  const { PAD_L, PAD_T, step, cw, y, yv, ticks, sma20, sma50, smaPath } = layout
  const totalHeight = layout.rsiTop + layout.RSI_H

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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="inline-flex rounded-lg border border-slate-700 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setChartType('candle')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${chartType === 'candle' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Candles
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${chartType === 'line' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Line
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowRSI((v) => !v)}
          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
            showRSI ? 'border-violet-500/50 bg-violet-500/10 text-violet-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          RSI {showRSI ? 'On' : 'Off'}
        </button>
      </div>

      <svg width={width} height={totalHeight} className="block" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t.y}>
            <line x1={PAD_L} x2={width - 58} y1={t.y} y2={t.y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
            <text x={width - 52} y={t.y + 3} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {t.label}
            </text>
          </g>
        ))}

        {chartType === 'candle' ? (
          layout.candles.map((c, i) => {
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
              </g>
            )
          })
        ) : (
          <>
            <path d={layout.closeAreaD} fill="url(#lineFillGrad)" stroke="none" />
            <path d={layout.closeLineD} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
          </>
        )}

        {layout.candles.map((c, i) => {
          const x = PAD_L + step * i + step / 2
          const up = c.close >= c.open
          const color = up ? UP : DOWN
          return (
            <rect
              key={`vol-${i}`}
              x={x - cw / 2}
              y={yv(c.volume)}
              width={cw}
              height={Math.max(1, layout.volTop + layout.VOL_H - yv(c.volume))}
              fill={color}
              opacity="0.22"
            />
          )
        })}

        {smaPath(sma20, '#38bdf8')}
        {smaPath(sma50, '#a78bfa')}

        {layout.RSI_H > 0 && (
          <>
            <line x1={PAD_L} x2={width - 58} y1={layout.yr(70)} y2={layout.yr(70)} stroke="#334155" strokeDasharray="2 3" strokeWidth="1" />
            <line x1={PAD_L} x2={width - 58} y1={layout.yr(30)} y2={layout.yr(30)} stroke="#334155" strokeDasharray="2 3" strokeWidth="1" />
            <text x={width - 52} y={layout.yr(70) + 3} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono, monospace">70</text>
            <text x={width - 52} y={layout.yr(30) + 3} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono, monospace">30</text>
            <path d={layout.rsiAreaD} fill="url(#rsiFillGrad)" stroke="none" />
            <path d={layout.rsiLineD} fill="none" stroke="#a78bfa" strokeWidth="1.4" />
            <text x={PAD_L} y={layout.rsiTop - 3} fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">RSI (14)</text>
          </>
        )}

        {hoverCandle && (
          <line x1={hoverX} x2={hoverX} y1={layout.PAD_T} y2={totalHeight} stroke="#334155" strokeWidth="1" />
        )}

        <defs>
          <linearGradient id="lineFillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rsiFillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>
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

      <div className="flex items-center gap-4 px-1 pb-1 pt-1 text-[10px] text-slate-500">
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
