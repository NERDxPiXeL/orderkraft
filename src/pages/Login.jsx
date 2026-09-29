import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, ArrowLeft, ArrowRight } from 'lucide-react'
import { Page, Button } from '../components/ui.jsx'
import { useAuth, DEMO_SLUG } from '../AuthContext.jsx'

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-stone-100 border border-transparent focus:border-brand-400 focus:bg-white outline-none text-sm transition-colors'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const data = await login(email.trim(), password)
      const list = data?.restaurants || []
      if (list.length > 0 && list[0]?.slug) {
        navigate(`/admin/${list[0].slug}`, { replace: true })
      } else {
        // Logged in fine, but the backend sees zero restaurants for this
        // account — almost always a stale backend (it only reads .env at
        // startup) or a wrong Supabase key. Say so instead of silently
        // bouncing to the home page.
        setError(
          'Logged in, but no restaurant is linked to this account yet. ' +
          'If you just signed up, restart your backend server (Ctrl+C, npm start) and log in again.'
        )
      }
    } catch (err) {
      const status = err?.response?.status
      setError(
        status === 401
          ? 'Invalid email or password.'
          : err.friendlyMessage || 'Could not log you in. Try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page className="min-h-screen bg-stone-950 text-white flex flex-col">
      <div className="max-w-md w-full mx-auto px-6 pt-10 pb-16 flex-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center">
            <UtensilsCrossed size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Welcome back</h1>
            <p className="text-sm text-white/60">Log in to your admin dashboard</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Email
            </label>
            <input
              className={`${inputCls} text-stone-900`}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Password
            </label>
            <input
              className={`${inputCls} text-stone-900`}
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-200 text-sm font-medium rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          New to OrderKraft?{' '}
          <Link to="/signup" className="text-brand-400 font-semibold hover:text-brand-300">
            Create account
          </Link>
        </p>

        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <Link
            to={`/admin/${DEMO_SLUG}`}
            className="inline-flex items-center gap-1.5 text-brand-300 font-semibold hover:text-brand-200 text-sm"
          >
            Just exploring? Try the live demo <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </Page>
  )
}
