import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, ArrowLeft } from 'lucide-react'
import { Page, Button } from '../components/ui.jsx'
import { useAuth } from '../AuthContext.jsx'

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-stone-100 border border-transparent focus:border-brand-400 focus:bg-white outline-none text-sm transition-colors'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [form, setForm] = useState({ restaurantName: '', name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSaving(true)
    try {
      const data = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        restaurantName: form.restaurantName.trim()
      })
      const slug = data?.restaurant?.slug
      navigate(slug ? `/admin/${slug}` : '/login', { replace: true })
    } catch (err) {
      setError(err.friendlyMessage || 'Could not create your account. Try again.')
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
            <h1 className="text-2xl font-black tracking-tight">Create your restaurant</h1>
            <p className="text-sm text-white/60">Free to start · live in minutes</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Restaurant name
            </label>
            <input
              className={`${inputCls} text-stone-900`}
              placeholder="e.g. The Spice Route"
              value={form.restaurantName}
              onChange={set('restaurantName')}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Your name
            </label>
            <input
              className={`${inputCls} text-stone-900`}
              placeholder="e.g. Dev Patel"
              value={form.name}
              onChange={set('name')}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Email
            </label>
            <input
              className={`${inputCls} text-stone-900`}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Password
            </label>
            <input
              className={`${inputCls} text-stone-900`}
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-200 text-sm font-medium rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? 'Creating your restaurant...' : 'Sign up free'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 font-semibold hover:text-brand-300">
            Log in
          </Link>
        </p>
      </div>
    </Page>
  )
}
