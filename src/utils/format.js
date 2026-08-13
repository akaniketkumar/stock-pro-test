export function formatINR(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  return `${sign}\u20B9${abs.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

export function formatPrice(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `\u20B9${Number(value).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

export function formatCompact(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(2)} Cr`
  if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(2)} L`
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)} K`
  return `${sign}${abs.toFixed(0)}`
}

export function formatMarketCap(crValue) {
  if (crValue === null || crValue === undefined) return '—'
  if (crValue >= 100000) return `\u20B9${(crValue / 100000).toFixed(2)} L Cr`
  if (crValue >= 1000) return `\u20B9${(crValue / 1000).toFixed(2)} K Cr`
  return `\u20B9${crValue.toLocaleString('en-IN')} Cr`
}

export function formatPercent(value, digits = 2, withSign = true) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const sign = withSign && value > 0 ? '+' : ''
  return `${sign}${Number(value).toFixed(digits)}%`
}

export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: digits })
}

export function isPositive(value) {
  return value !== null && value !== undefined && value > 0
}

export function isNegative(value) {
  return value !== null && value !== undefined && value < 0
}

export function changeClass(value) {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-rose-400'
  return 'text-slate-400'
}
