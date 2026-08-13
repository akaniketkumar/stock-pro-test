import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'stockpro-state-v1'

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
    return null
  } catch {
    return null
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [initialState] = useState(loadState)
  const [isPremium, setIsPremium] = useState(() => initialState?.isPremium ?? false)
  const [user, setUser] = useState(() => initialState?.user ?? null)
  const [watchlist, setWatchlist] = useState(() => initialState?.watchlist ?? [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ isPremium, user, watchlist }))
    } catch {
      // storage unavailable (e.g. private mode) — state still works in-memory
    }
  }, [isPremium, user, watchlist])

  const subscribe = useCallback((plan) => {
    setIsPremium(true)
    return { plan, activated: true }
  }, [])

  const login = useCallback(({ email, name }) => {
    setUser({ email, name: name || email.split('@')[0] })
    return true
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setIsPremium(false)
  }, [])

  const toggleWatchlist = useCallback((id) => {
    setWatchlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  return (
    <AppContext.Provider value={{ isPremium, user, watchlist, subscribe, login, logout, toggleWatchlist }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
