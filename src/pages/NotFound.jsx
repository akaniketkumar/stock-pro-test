import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-28 text-center">
      <div className="font-mono text-7xl font-extrabold text-slate-700">404</div>
      <h1 className="mt-4 text-xl font-bold text-slate-100">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for does not exist or has moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
        <Link to="/screener" className="btn-ghost">
          Open Screener
        </Link>
      </div>
    </div>
  )
}
