import Help from '../ui/Help'
import { formatPrice } from '../../utils/format'

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
    </div>
  )
}
