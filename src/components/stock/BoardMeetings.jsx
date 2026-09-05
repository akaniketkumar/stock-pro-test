import Help from '../ui/Help'

const STATUS_STYLES = {
  Held: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  Scheduled: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  Approved: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
}

function statusBadge(status) {
  const cls = STATUS_STYLES[status] || 'border-slate-600 bg-slate-800 text-slate-300'
  return <span className={`chip ${cls}`}>{status}</span>
}

export default function BoardMeetings({ meetings }) {
  const list = meetings || []
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
            <th className="py-2.5 pr-4 font-semibold">Date</th>
            <th className="py-2.5 pr-4 font-semibold">Purpose</th>
            <th className="py-2.5 pr-4 font-semibold">
              <span className="inline-flex items-center gap-1">
                Status
                <Help text="Held = the meeting already took place. Scheduled = the company has announced the date. Approved = the proposal was cleared by the board." />
              </span>
            </th>
            <th className="py-2.5 font-semibold">Source</th>
          </tr>
        </thead>
        <tbody>
          {list.map((m) => (
            <tr key={m.id} className="border-b border-slate-800/50 text-slate-300 transition-colors hover:bg-terminal-800/40">
              <td className="py-3 pr-4 font-mono text-slate-400">{m.date}</td>
              <td className="py-3 pr-4 font-medium text-slate-200">{m.purpose}</td>
              <td className="py-3 pr-4">{statusBadge(m.status)}</td>
              <td className="py-3 font-mono text-xs">
                {m.link && m.link !== '#' ? (
                  <a href={m.link} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 hover:underline">
                    View on NSE →
                  </a>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
