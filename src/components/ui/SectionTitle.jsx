import Help from './Help'

export default function SectionTitle({ icon, title, subtitle, right, help, helpText }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
          {icon && <span className="text-sky-400">{icon}</span>}
          {title}
          {helpText && <Help text={helpText} />}
          {help && <Help glossaryKey={help} />}
        </h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

export function PremiumBadge({ small = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 font-bold text-terminal-950 ${
        small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <svg className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.285-3.958a1 1 0 00-.363-1.118L2.71 9.385c-.784-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.639-3.958z" />
      </svg>
      PREMIUM
    </span>
  )
}
