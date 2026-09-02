import Help from '../ui/Help'
import { formatPrice } from '../../utils/format'

const VERDICT_STYLE = {
  buy: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  sell: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  neutral: 'border-slate-600/40 bg-slate-700/20 text-slate-400',
}
const VERDICT_LABEL = { buy: 'Buy', sell: 'Sell', neutral: 'Neutral' }

function VerdictChip({ verdict }) {
  return <span className={`chip font-bold ${VERDICT_STYLE[verdict] || VERDICT_STYLE.neutral}`}>{VERDICT_LABEL[verdict] || 'Neutral'}</span>
}

function OscillatorsTable({ oscillators }) {
  if (!oscillators || oscillators.length === 0) return null
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="border-b border-slate-800 bg-terminal-900/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        Oscillators
      </div>
      {oscillators.map((o) => (
        <div key={o.label} className="flex items-center justify-between gap-4 border-b border-slate-800/60 px-4 py-3 last:border-0">
          <span className="text-sm text-slate-300">{o.label}</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-slate-200">{o.value != null ? `${o.value.toFixed(o.digits ?? 2)}${o.suffix || ''}` : '—'}</span>
            <VerdictChip verdict={o.verdict} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MovingAveragesTable({ movingAverages }) {
  if (!movingAverages || movingAverages.length === 0) return null
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="grid grid-cols-3 border-b border-slate-800 bg-terminal-900/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>Moving Averages</span>
        <span className="text-right">SMA</span>
        <span className="text-right">EMA</span>
      </div>
      {movingAverages.map((m) => (
        <div key={m.period} className="grid grid-cols-3 items-center gap-2 border-b border-slate-800/60 px-4 py-3 last:border-0">
          <span className="text-sm text-slate-300">Period {m.period}</span>
          <div className="flex items-center justify-end gap-2">
            <span className="font-mono text-xs text-slate-300">{m.sma != null ? formatPrice(m.sma) : '—'}</span>
            <VerdictChip verdict={m.smaVerdict} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="font-mono text-xs text-slate-300">{m.ema != null ? formatPrice(m.ema) : '—'}</span>
            <VerdictChip verdict={m.emaVerdict} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DmaRow({ label, value, position, glossaryKey, helpText }) {
  const above = position === 'above'
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 px-4 py-3.5 last:border-0">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-slate-200">{label}</span>
        <Help text={helpText} glossaryKey={glossaryKey} />
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold text-slate-100">{value != null ? formatPrice(value) : '—'}</span>
        {position === 'na' ? (
          <span className="chip bg-slate-800 text-slate-400">N/A</span>
        ) : (
          <span
            className={`chip font-bold ${
              above ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            }`}
          >
            {above ? '▲ Above' : '▼ Below'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function TechnicalIndicators({ technical, stock }) {
  if (!technical) return null
  const trend = technical.above50 === 'above' && technical.above200 === 'above' ? 'Bullish' : 'Bearish'
  const hasExtended = Array.isArray(technical.oscillators) && technical.oscillators.length > 0

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Current Market Price
            <Help glossaryKey="price" text="The latest traded price of the stock on the exchange." />
          </div>
          <div className={`mt-1 font-mono text-3xl font-extrabold ${technical.price >= (technical.dma50 || 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatPrice(technical.price)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            52W range: {formatPrice(technical.fiftyTwoWLow)} – {formatPrice(technical.fiftyTwoWHigh)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-terminal-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trend Signal</span>
            <span className={`chip font-bold ${trend === 'Bullish' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/40 bg-rose-500/10 text-rose-300'}`}>
              {trend}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Price is trading {technical.above200 === 'above' ? 'above' : 'below'} the 200 DMA, indicating a{' '}
            {technical.above200 === 'above' ? 'long-term uptrend' : 'long-term downtrend'}. Above the 50 DMA, the
            medium-term trend is {technical.above50 === 'above' ? 'positive' : 'negative'}.
          </p>
        </div>
      </div>

      {hasExtended && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800 bg-terminal-900/40 p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Summary (across {technical.oscillators.length + technical.movingAverages.length * 2} indicators)
            <Help text="Combined verdict from every oscillator and moving average below — mirrors the kind of summary gauge TradingView shows, computed from the same real price history." iconSize="h-3 w-3" />
          </div>
          <span
            className={`chip font-bold ${
              technical.summary === 'Buy'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : technical.summary === 'Sell'
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : 'border-slate-600/40 bg-slate-700/20 text-slate-400'
            }`}
          >
            {technical.summary} · {technical.buyCount} Buy / {technical.sellCount} Sell / {technical.neutralCount} Neutral
          </span>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
        <DmaRow label="30 DMA" value={technical.dma30} position={technical.above30} helpText="Average closing price of the last 30 days. Price above it = short-term uptrend." />
        <DmaRow label="50 DMA" value={technical.dma50} position={technical.above50} glossaryKey="dma50" />
        <DmaRow label="200 DMA" value={technical.dma200} position={technical.above200} glossaryKey="dma200" />
        <div className="grid grid-cols-2 divide-x divide-slate-800/60">
          <div className="px-4 py-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">% from 52W High</div>
            <div className={`mt-1 font-mono text-sm font-bold ${technical.pctFromHigh > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
              −{technical.pctFromHigh}%
            </div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">% above 52W Low</div>
            <div className="mt-1 font-mono text-sm font-bold text-emerald-400">+{technical.pctFromLow}%</div>
          </div>
        </div>
      </div>

      {hasExtended && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <OscillatorsTable oscillators={technical.oscillators} />
          <MovingAveragesTable movingAverages={technical.movingAverages} />
        </div>
      )}
    </div>
  )
}
