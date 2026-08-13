import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-300">{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} className="input" />
    </label>
  )
}

export default function Signup() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('All fields are required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    login({ email, name })
    navigate('/')
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="card p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Start screening stocks like a professional in minutes.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" autoComplete="name" />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" />
          {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}
          <button type="submit" className="btn-primary w-full py-2.5">
            Sign up free
          </button>
        </form>
      </div>
      <div className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-sky-400 hover:text-sky-300">
          Log in
        </Link>
      </div>
    </div>
  )
}
