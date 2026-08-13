import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PremiumBadge } from './SectionTitle'

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 499,
    per: '/month',
    features: ['Full AI Stock Analyzer', '16-Point Forensic Reports', 'Daily conviction updates', 'Unlimited watchlists'],
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 3999,
    per: '/year',
    features: ['Everything in Monthly', '2 months free', 'IPO + FII/DII alerts', 'Priority support'],
    highlight: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 9999,
    per: 'one-time',
    features: ['Everything in Yearly', 'Forever access', 'Early feature access', 'Dedicated analyst desk'],
    highlight: false,
  },
]

export function SubscribeModal({ onClose }) {
  const { subscribe } = useApp()
  const [selected, setSelected] = useState('yearly')
  const [done, setDone] = useState(false)

  function handleSubscribe() {
    subscribe(PLANS.find((p) => p.id === selected))
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-terminal-900 shadow-2xl">
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">Unlock StockPro Premium</h2>
                <PremiumBadge />
              </div>
              <p className="mt-1 text-sm text-slate-400">
                AI Stock Analyzer, 16-Point Forensic Checks and deep conviction reasoning for every Nifty stock.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <h3 className="text-lg font-bold text-white">Welcome to Premium!</h3>
            <p className="max-w-sm text-sm text-slate-400">
              The AI Stock Analyzer for this stock is now unlocked. Explore the conviction meter and forensic report below.
            </p>
            <button type="button" onClick={onClose} className="btn-primary mt-2">
              Start exploring
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 px-6 py-5 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelected(plan.id)}
                  className={`relative rounded-xl border p-4 text-left transition-all ${
                    selected === plan.id
                      ? 'border-amber-400 bg-amber-500/10 shadow-glow'
                      : 'border-slate-700 bg-terminal-850 hover:border-slate-600'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-2 left-3 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-terminal-950">
                      BEST VALUE
                    </span>
                  )}
                  <div className="text-sm font-bold text-slate-200">{plan.name}</div>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-white">
                    ₹{plan.price.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-500">{plan.per}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                        <svg className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-slate-800 bg-terminal-900/60 px-6 py-4">
              <p className="text-[11px] text-slate-500">Demo checkout · No real payment is processed.</p>
              <button type="button" onClick={handleSubscribe} className="btn bg-gradient-to-r from-amber-400 to-yellow-500 font-bold text-terminal-950 hover:from-amber-300 hover:to-yellow-400">
                Subscribe · ₹{PLANS.find((p) => p.id === selected)?.price.toLocaleString('en-IN')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function LockedOverlay({ children, title, subtitle, teaser, minHeight = 'min-h-[420px]' }) {
  const { isPremium } = useApp()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="relative">
      {!isPremium && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className={`flex h-full flex-col items-center justify-center gap-4 p-6 text-center ${minHeight}`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
              <svg className="h-6 w-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 003 14h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-white">{title || 'Premium Feature'}</h3>
              <p className="mt-1 max-w-md text-sm text-slate-400">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => setShowModal(true)} className="btn bg-gradient-to-r from-amber-400 to-yellow-500 font-bold text-terminal-950 hover:from-amber-300 hover:to-yellow-400">
                Subscribe to Premium
              </button>
              {teaser && <span className="text-xs text-slate-500">{teaser}</span>}
            </div>
          </div>
        </div>
      )}
      <div className={!isPremium ? 'pointer-events-none select-none blur-md' : ''}>{children}</div>
      {!isPremium && <div className="pointer-events-none absolute inset-0 z-[5] rounded-xl bg-terminal-950/30" />}
      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
