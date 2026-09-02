import { formatCompact, formatINR, formatNumber } from '../../utils/format'
import Help from '../ui/Help'

function MetricRow({ label, value, hint, tone, glossaryKey }) {
  const toneClass =
    tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-rose-400' : tone === 'warn' ? 'text-amber-400' : 'text-slate-100'
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 px-4 py-3 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">{label}</span>
        {glossaryKey && <Help glossaryKey={glossaryKey} />}
        {hint && (
          <span className="hidden rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline">{hint}</span>
        )}
      </div>
      <span className={`font-mono text-sm font-bold ${toneClass}`}>{value}</span>
    </div>
  )
}

export default function FinancialOverview({ stock }) {
  const rows = [
    { label: 'P/E Ratio', value: stock.pe ? formatNumber(stock.pe, 1) : '—', hint: 'Price to earnings', glossaryKey: 'pe' },
    { label: 'ROCE', value: stock.roce !== null && stock.roce !== undefined ? `${stock.roce}%` : '—', hint: 'Return on capital employed', tone: stock.roce >= 15 ? 'good' : stock.roce > 0 ? 'warn' : 'bad', glossaryKey: 'roce' },
    { label: 'ROE', value: stock.roe !== null && stock.roe !== undefined ? `${stock.roe}%` : '—', hint: 'Return on equity', tone: stock.roe >= 15 ? 'good' : stock.roe > 0 ? 'warn' : 'bad', glossaryKey: 'roe' },
    { label: 'Debt to Equity', value: stock.debtToEquity !== null && stock.debtToEquity !== undefined ? stock.debtToEquity.toFixed(2) : '—', hint: 'Leverage', tone: stock.debtToEquity > 2 ? 'bad' : stock.debtToEquity > 1 ? 'warn' : 'good', glossaryKey: 'debtToEquity' },
    { label: 'Book Value', value: stock.bookValue ? formatINR(stock.bookValue, 2) : '—', hint: 'Per share', glossaryKey: 'bookValue' },
    { label: 'EPS (TTM)', value: stock.eps ? formatINR(stock.eps, 2) : '—', hint: 'Earnings per share', glossaryKey: 'eps' },
    { label: 'Current Ratio', value: stock.currentRatio ? stock.currentRatio.toFixed(2) : '—', hint: 'Liquidity', tone: stock.currentRatio >= 1.2 ? 'good' : stock.currentRatio > 0 ? 'warn' : 'bad', glossaryKey: 'currentRatio' },
    { label: 'EBITDA Margin', value: stock.ebitdaMargin !== null && stock.ebitdaMargin !== undefined ? `${stock.ebitdaMargin}%` : '—', hint: 'Operating efficiency', tone: stock.ebitdaMargin >= 15 ? 'good' : stock.ebitdaMargin > 0 ? 'warn' : 'bad', glossaryKey: 'ebitdaMargin' },
    { label: 'Revenue (TTM)', value: stock.revenue ? formatCompact(stock.revenue) : '—', hint: 'Cr', glossaryKey: 'revenue' },
    { label: 'Net Profit (TTM)', value: stock.netProfit ? formatCompact(stock.netProfit) : '—', hint: 'Cr', glossaryKey: 'netProfit' },
    { label: 'Operating Cash Flow', value: stock.operatingCashFlow ? formatCompact(stock.operatingCashFlow) : '—', hint: 'Cr', glossaryKey: 'operatingCashFlow' },
    { label: 'Free Cash Flow', value: stock.freeCashFlow ? formatCompact(stock.freeCashFlow) : '—', hint: 'Cr', tone: stock.freeCashFlow > 0 ? 'good' : 'bad', glossaryKey: 'freeCashFlow' },
  ]

  return (
    <div>
      {stock.fundamentalsModeled && (
        <div className="mb-2 px-1 text-[11px] text-slate-500">
          Modeled estimate for this company — not from official filings.
        </div>
      )}
      <div className="divide-y divide-slate-800/60">
        {rows.map((r) => (
          <MetricRow key={r.label} {...r} />
        ))}
      </div>
    </div>
  )
}
