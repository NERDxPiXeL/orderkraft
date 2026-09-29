import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Guarded: null when env vars are missing so the build (and dev) never crashes.
const supabase = url && anonKey ? createClient(url, anonKey) : null

if (!supabase) {
  console.warn(
    '[OrderKraft] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — auth runs in localStorage fallback mode (no auto-refresh).'
  )
}

/** Local storage key used for raw tokens when no supabase client is available. */
export const FALLBACK_TOKENS_KEY = 'orderkraft_tokens'

/**
 * Read the current access token. Async because supabase's getSession() is
 * async. Falls back to plain localStorage when the supabase client is null.
 * Used by the axios request interceptor.
 */
export async function getAccessToken() {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.access_token) return data.session.access_token
    } catch {
      /* fall through to localStorage */
    }
  }
  try {
    const raw = localStorage.getItem(FALLBACK_TOKENS_KEY)
    const tokens = raw ? JSON.parse(raw) : null
    return tokens?.access_token || null
  } catch {
    return null
  }
}

export default supabase
