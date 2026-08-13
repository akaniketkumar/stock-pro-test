import { useState } from 'react'
import Help from '../ui/Help'
import { changeClass, formatINR, formatNumber, formatPercent } from '../../utils/format'

const TABS = [
  { key: 'quarterly', label: 'Quarterly Results' },
  { key: 'pnl', label: 'Profit & Loss' },
  { key: 'growth', label: 'Growth' },
  { key: 'balanceSheet', label: 'Balance Sheet' },
  { key: 'cashflows', label: 'Cash Flows' },
  { key: 'ratios', label: 'Ratios' },
]

function numCell(value, cls = '') {
  return <td className={`px-4 py-2.5 text-right font-mono text-sm text-slate-300 ${cls}`}>{value != null ? formatINR(value) : '—'}</td>
}

function QuarterlyTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-slate-800 bg-terminal-900/40 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Quarter</th>
            <th className="px-4 py-3 text-right font-semibold">Sales</th>
            <th className="px-4 py-3 text-right font-semibold">Expenses</th>
            <th className="px-4 py-3 text-right font-semibold">Op. Profit</th>
            <th className="px-4 py-3 text-right font-semibold">OPM</th>
            <th className="px-4 py-3 text-right font-semibold">Other Inc.</th>
            <th className="px-4 py-3 text-right font-semibold">Net Profit</th>
            <th className="px-4 py-3 text-right font-semibold">EPS</th>
            <th className="px-4 py-3 text-right font-semibold">Sales QoQ</th>
            <th className="px-4 py-3 text-right font-semibold">NP QoQ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.period} className="border-b border-slate-800/50 transition-colors hover:bg-terminal-800/40">
              <td className="px-4 py-2.5 font-mono text-sm font-semibold text-slate-100">{r.period}</td>
              {numCell(r.sales)}
              {numCell(r.expenses)}
              {numCell(r.operatingProfit)}
              <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-300">{r.opm}%</td>
              {numCell(r.otherIncome)}
              {numCell(r.netProfit, changeClass(r.netProfit))}
              <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-300">₹{r.eps}</td>
              <td className={`px-4 py-2.5 text-right font-mono text-sm ${changeClass(r.salesQoQ)}`}>{r.salesQoQ > 0 ? '+' : ''}{r.salesQoQ}%</td>
              <td className={`px-4 py-2.5 text-right font-mono text-sm ${changeClass(r.profitQoQ)}`}>{r.profitQoQ > 0 ? '+' : ''}{r.profitQoQ}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const PNL_HEADERS = ['Sales', 'Expenses', 'Op. Profit', 'OPM', 'Other Inc.', 'Interest', 'Depreciation', 'PBT', 'Tax', 'Net Profit', 'EPS']

function PnlTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-slate-800 bg-terminal-900/40 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Year</th>
            {PNL_HEADERS.map((h) => (
              <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year} className="border-b border-slate-800/50 transition-colors hover:bg-terminal-800/40">
              <td className="px-4 py-2.5 font-mono text-sm font-semibold text-slate-100">{r.year}</td>
              {numCell(r.sales)}
              {numCell(r.expenses)}
              {numCell(r.operatingProfit)}
              <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-300">{r.opm}%</td>
              {numCell(r.otherIncome)}
              {numCell(r.interest)}
              {numCell(r.depreciation)}
              {numCell(r.pbt, changeClass(r.pbt))}
              {numCell(r.tax)}
              {numCell(r.netProfit, changeClass(r.netProfit))}
              <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-300">₹{r.eps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GrowthCards({ growth }) {
  const groups = [
    { title: 'Sales Growth (CAGR)', key: 'sales', help: 'Sales growth rate (CAGR) over 10, 5, 3 years and the latest trailing twelve months.' },
    { title: 'Profit Growth (CAGR)', key: 'profit', help: 'Net profit growth rate (CAGR) over the same periods.' },
    { title: 'Price Return (CAGR)', key: 'price', help: 'Annualized stock price return over 10, 5, 3 and 1 years.' },
    { title: 'Return on Equity (RoE)', key: 'roe', help: 'Average RoE over 10, 5, 3 years and the last financial year.' },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {groups.map((g) => (
        <div key={g.key} className="rounded-xl border border-slate-800 bg-terminal-900/40 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {g.title}
            <Help text={g.help} />
          </div>
          <div className="mt-3 space-y-2">
            {growth[g.key].map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className={`font-mono text-sm font-bold ${changeClass(item.value)}`}>
                  {g.key === 'roe' ? `${item.value}%` : `${item.value > 0 ? '+' : ''}${item.value}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const BS_ROWS = [
  { label: 'Equity Share Capital', key: 'equityCapital', help: 'The face value of all issued shares. A company raises this when it issues stock.' },
  { label: 'Reserves & Surplus', key: 'reserves', help: 'Profits retained in the business over time, not paid out as dividends.' },
  { label: 'Net Worth', key: 'netWorth', help: 'Shareholders funds = equity capital + reserves. The book value owned by shareholders.' },
  { label: 'Borrowings', key: 'borrowings', help: 'Total debt owed to banks, bonds and other lenders.' },
  { label: 'Fixed Assets', key: 'fixedAssets', help: 'Long-term physical assets like land, buildings, plant and machinery.' },
  { label: 'Capital Work in Progress', key: 'cwip', help: 'Assets under construction, not yet ready for use.' },
  { label: 'Investments', key: 'investments', help: 'Money invested in other companies, mutual funds or securities.' },
  { label: 'Current Assets', key: 'currentAssets', help: 'Assets convertible to cash within a year — receivables, inventory, cash.' },
  { label: 'Current Liabilities', key: 'currentLiabilities', help: 'Obligations due within a year — payables, short-term loans.' },
  { label: 'Other Assets', key: 'otherAssets', help: 'Miscellaneous assets not captured in the major heads.' },
]

function BalanceSheetTable({ bs }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {BS_ROWS.map((row) => (
        <div key={row.key} className="flex items-center justify-between rounded-lg border border-slate-800 bg-terminal-900/40 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            {row.label}
            <Help text={row.help} iconSize="h-3 w-3" />
          </span>
          <span className="font-mono text-sm font-bold text-slate-100">{formatINR(bs[row.key])}</span>
        </div>
      ))}
    </div>
  )
}

const CF_ROWS = [
  { label: 'Cash Flow from Operations', key: 'operating', help: 'Cash generated from the core business, before investment and financing.' },
  { label: 'Cash Flow from Investing', key: 'investing', help: 'Net cash spent on assets and investments (capex). Usually negative.' },
  { label: 'Cash Flow from Financing', key: 'financing', help: 'Net cash from borrowing, share issuance and dividends paid.' },
  { label: 'Net Cash Flow', key: 'netCashFlow', help: 'Total cash added or consumed in the period.' },
]

const RATIO_ROWS = [
  { label: 'Debtor Days', key: 'debtorDays', help: 'Average days taken by customers to pay. Lower is better.' },
  { label: 'Inventory Days', key: 'inventoryDays', help: 'Average days goods sit in stock before being sold.' },
  { label: 'Payable Days', key: 'payableDays', help: 'Average days the company takes to pay its suppliers.' },
  { label: 'Working Capital Days', key: 'workingCapitalDays', help: 'Cash cycle = debtors + inventory − payables.' },
  { label: 'RoCE', key: 'roce', help: 'Return on Capital Employed, a profitability measure.', suffix: '%' },
  { label: 'Debt / Equity', key: 'debtToEquity', help: 'Leverage ratio — total debt vs shareholders equity.' },
  { label: 'Current Ratio', key: 'currentRatio', help: 'Current assets divided by current liabilities. Above 1 is healthy.' },
  { label: 'EBITDA Margin', key: 'ebitdaMargin', help: 'Operating profitability before interest, tax, depreciation and amortization.', suffix: '%' },
]

function MetricPairs({ rows, data }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between rounded-lg border border-slate-800 bg-terminal-900/40 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            {row.label}
            <Help text={row.help} iconSize="h-3 w-3" />
          </span>
          <span className="font-mono text-sm font-bold text-slate-100">{data[row.key] != null ? `${data[row.key]}${row.suffix || ''}` : '—'}</span>
        </div>
      ))}
    </div>
  )
}

export default function FinancialStatements({ data }) {
  const [tab, setTab] = useState('quarterly')
  if (!data) return null
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                : 'border-slate-800 bg-terminal-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'quarterly' && <QuarterlyTable rows={data.quarterly} />}
      {tab === 'pnl' && <PnlTable rows={data.pnl} />}
      {tab === 'growth' && <GrowthCards growth={data.growth} />}
      {tab === 'balanceSheet' && <BalanceSheetTable bs={data.balanceSheet} />}
      {tab === 'cashflows' && <MetricPairs rows={CF_ROWS} data={data.cashFlows} />}
      {tab === 'ratios' && <MetricPairs rows={RATIO_ROWS} data={data.ratios} />}
    </div>
  )
}
