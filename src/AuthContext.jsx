import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import supabase, { FALLBACK_TOKENS_KEY } from './supabaseClient.js'
import api from './api.js'

/** Slug of the public demo restaurant — bypasses auth everywhere. */
export const DEMO_SLUG = 'spice-route'

const RESTAURANTS_KEY = 'orderkraft_restaurants'
const TOKENS_KEY = FALLBACK_TOKENS_KEY // fallback mode only (supabase env missing)

const readJSON = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

/**
 * Read the current access token synchronously-ish (async because supabase's
 * getSession is async). Used by the axios interceptor.
 * (Implemented in supabaseClient.js to avoid an import cycle with api.js.)
 */
export { getAccessToken } from './supabaseClient.js'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [restaurants, setRestaurants] = useState(() => readJSON(RESTAURANTS_KEY) || [])
  const [loading, setLoading] = useState(true)

  const persistRestaurants = useCallback((list) => {
    const arr = Array.isArray(list) ? list : []
    setRestaurants(arr)
    writeJSON(RESTAURANTS_KEY, arr)
  }, [])

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me')
      setUser(res.data?.user || null)
      persistRestaurants(res.data?.restaurants || [])
      return res.data
    } catch {
      // Token invalid/expired — clear local auth state
      setUser(null)
      persistRestaurants([])
      return null
    }
  }, [persistRestaurants])

  // Init: restore session, then refresh user + restaurants
  useEffect(() => {
    let alive = true
    let unsubscribe = null
    ;(async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        if (!alive) return
        const s = data?.session || null
        setSession(s)
        if (s?.access_token) {
          await refreshMe()
        } else {
          setUser(null)
          persistRestaurants([])
        }
        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession)
          if (!newSession) {
            setUser(null)
            persistRestaurants([])
          }
        })
        unsubscribe = () => sub?.subscription?.unsubscribe()
        if (alive) setLoading(false)
        return
      }

      // Fallback mode: tokens in localStorage, no auto-refresh
      const tokens = readJSON(TOKENS_KEY)
      if (!alive) return
      if (tokens?.access_token) {
        setSession({ access_token: tokens.access_token, refresh_token: tokens.refresh_token })
        setUser(tokens.user || null)
        await refreshMe()
      } else {
        setSession(null)
        setUser(null)
        persistRestaurants([])
      }
      setLoading(false)
    })()
    return () => {
      alive = false
      if (unsubscribe) unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/api/auth/login', { email, password })
      const { access_token, refresh_token, user: u, restaurants: list } = res.data || {}
      if (supabase) {
        const { error, data } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) throw error
        setSession(data?.session || null)
      } else {
        const sess = { access_token, refresh_token }
        writeJSON(TOKENS_KEY, { ...sess, user: u })
        setSession(sess)
      }
      setUser(u || null)
      persistRestaurants(list || [])
      return res.data
    },
    [persistRestaurants]
  )

  const signup = useCallback(
    async ({ name, email, password, restaurantName }) => {
      const res = await api.post('/api/auth/signup', {
        name,
        email,
        password,
        restaurantName
      })
      const { access_token, refresh_token, user: u, restaurant } = res.data || {}
      if (supabase) {
        const { error, data } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) throw error
        setSession(data?.session || null)
      } else {
        const sess = { access_token, refresh_token }
        writeJSON(TOKENS_KEY, { ...sess, user: u })
        setSession(sess)
      }
      setUser(u || null)
      persistRestaurants(restaurant ? [restaurant] : [])
      return res.data
    },
    [persistRestaurants]
  )

  const logout = useCallback(async () => {
    try {
      if (supabase) await supabase.auth.signOut()
    } catch {
      /* ignore sign-out errors */
    }
    try {
      localStorage.removeItem(TOKENS_KEY)
      localStorage.removeItem(RESTAURANTS_KEY)
    } catch {
      /* storage unavailable */
    }
    setSession(null)
    setUser(null)
    setRestaurants([])
  }, [])

  const value = useMemo(
    () => ({ session, user, restaurants, loading, login, signup, logout }),
    [session, user, restaurants, loading, login, signup, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
