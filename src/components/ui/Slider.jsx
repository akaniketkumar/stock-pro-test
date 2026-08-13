import Help from './Help'

export default function Slider({ label, help, value, min, max, step = 1, onChange, format = (v) => v, disabled }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="flex items-center gap-1 text-xs font-semibold text-slate-300">
          {label}
          {help && <Help glossaryKey={help} iconSize="h-3 w-3" />}
        </label>
        <span className="rounded-md border border-slate-700 bg-terminal-900 px-2 py-0.5 font-mono text-xs font-bold text-sky-300">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: `linear-gradient(to right, #38bdf8 ${pct}%, #334155 ${pct}%)`,
        }}
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-600">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}
