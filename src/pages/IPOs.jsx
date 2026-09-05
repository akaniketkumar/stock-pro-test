export default function IPOs() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-28 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/10">
        <svg className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      <h1 className="text-2xl font-extrabold tracking-tight text-white">IPO Watch — Coming Soon</h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-400">
        Real-time IPO data (GMP, subscription, lot size and listing details) needs a paid data feed to be accurate.
        We'd rather show nothing than show numbers that aren't real — this section will go live once that's connected.
      </p>
    </div>
  )
}
