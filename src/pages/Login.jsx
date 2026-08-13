import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="card p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
      <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input"
      />
    </label>
  )
}

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in both fields.')
      return
    }
    login({ email })
    navigate('/')
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your StockPro account"
      footer={
        <>
          New to StockPro?{' '}
          <Link to="/signup" className="font-semibold text-sky-400 hover:text-sky-300">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}
        <button type="submit" className="btn-primary w-full py-2.5">
          Log in
        </button>
      </form>
    </AuthShell>
  )
}
