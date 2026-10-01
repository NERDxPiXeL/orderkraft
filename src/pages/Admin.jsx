import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  BellRing,
  BellOff,
  ClipboardList,
  UtensilsCrossed,
  QrCode,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Clock,
  IndianRupee,
  Hourglass,
  Flame,
  CircleCheck,
  RefreshCw,
  Search,
  AlertTriangle,
  LogOut,
  Wallet,
  ShieldCheck
} from 'lucide-react'
import api from '../api.js'
import { getSocket, joinAdmin } from '../socket.js'
import { useAuth, DEMO_SLUG } from '../AuthContext.jsx'
import { ToastProvider, useToasts } from '../components/Toasts.jsx'
import {
  Page,
  Button,
  Modal,
  Skeleton,
  EmptyState,
  StatusPill,
  DishImage,
  inr
} from '../components/ui.jsx'

/* ---------- helpers ---------- */
function playAlert() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    ;[0, 0.28].forEach((delay, idx) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.frequency.value = idx === 0 ? 880 : 1174.66
      const t = ctx.currentTime + delay
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24)
      o.start(t)
      o.stop(t + 0.26)
    })
  } catch {
    /* audio unavailable */
  }
}

const normOrder = (o, tableMap = {}) => ({
  id: o._id || o.id,
  table:
    tableMap[o.tableId] ??
    tableMap[o.table] ??
    o.table?.number ??
    o.table?.name ??
    o.table ??
    o.tableId ??
    '?',
  customerName: o.customerName || '',
  orderType: o.orderType || 'dine-in',
  items: o.items || [],
  subtotal: o.subtotal,
  tax: o.tax,
  total:
    o.total ??
    (o.items || []).reduce((s, i) => s + (Number(i.price) || 0) * (i.quantity ?? i.qty ?? 1), 0),
  status: o.status || 'Pending',
  paymentMethod: o.paymentMethod || 'counter',
  paymentStatus: o.paymentStatus || 'unpaid',
  paymentRef: o.paymentRef || '',
  createdAt: o.createdAt,
  raw: o
})

const normDish = (m) => ({
  id: m._id || m.id,
  name: m.name,
  description: m.description || '',
  price: Number(m.price) || 0,
  category: m.category || 'Other',
  imageUrl: m.image || m.imageUrl || '',
  available: m.available ?? m.inStock ?? m.isAvailable ?? true
})

const NEXT_STATUS = { Pending: 'Preparing', Preparing: 'Served', Served: 'Completed' }

// "Table 5 · Rahul · Takeaway" — same label everywhere (card, toast, confirm)
const orderTitle = (o) => {
  const type = o.orderType === 'takeaway' ? 'Takeaway' : 'Dine-in'
  return `Table ${o.table}${o.customerName ? ` · ${o.customerName}` : ''} · ${type}`
}

const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '—'

/* ---------- page ---------- */
export default function AdminPage() {
  return (
    <ToastProvider>
      <Admin />
    </ToastProvider>
  )
}

function Admin() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { push } = useToasts()
  const { session, logout } = useAuth()
  const isDemo = slug === DEMO_SLUG

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('orders')
  const [now, setNow] = useState(new Date())
  const [muted, setMuted] = useState(false)

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [tableMap, setTableMap] = useState({}) // tableId -> human table number

  const mutedRef = useRef(muted)
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  // Restaurant
  useEffect(() => {
    let alive = true
    api
      .get(`/api/restaurant/${slug}`)
      .then((res) => {
        if (!alive) return
        setRestaurant(res.data?.restaurant || res.data)
      })
      .catch((err) => {
        if (alive) setError(err.friendlyMessage || 'Could not load restaurant.')
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  const restaurantId = restaurant?._id || restaurant?.id

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Table id -> number map, so order cards show "Table 5" instead of raw UUIDs.
  useEffect(() => {
    if (!restaurantId) return
    let alive = true
    api
      .get('/api/tables', { params: { restaurant: restaurantId } })
      .then((res) => {
        if (!alive) return
        const list = res.data?.tables || res.data || []
        const map = {}
        list.forEach((t) => {
          const id = t._id || t.id
          const n = t.tableNumber ?? t.number ?? t.name
          if (id && n !== undefined && n !== null && n !== '') map[String(id)] = n
        })
        setTableMap(map)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [restaurantId])

  // Orders: initial load
  const loadOrders = useCallback(async () => {
    if (!restaurantId) return
    try {
      const res = await api.get('/api/orders', { params: { restaurant: restaurantId } })
      const list = Array.isArray(res.data) ? res.data : res.data?.orders || []
      setOrders(list.map((o) => normOrder(o, tableMap)))
    } catch {
      /* keep old orders on transient failure */
    } finally {
      setOrdersLoading(false)
    }
  }, [restaurantId, tableMap])

  // Demo orders simulation for spice-route
  useEffect(() => {
    if (!isDemo || orders.length > 0) return
    // Seed demo orders if empty
    const demoOrders = [
      {
        id: 'demo-1',
        table: '4',
        customerName: 'Rahul',
        orderType: 'dine-in',
        items: [
          { name: 'Paneer Tikka Burger', price: 180, quantity: 2 },
          { name: 'Cheese Garlic Naan Bites', price: 120, quantity: 1 }
        ],
        subtotal: 480,
        tax: 24,
        total: 504,
        status: 'Pending',
        paymentMethod: 'counter',
        paymentStatus: 'unpaid',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: 'demo-2',
        table: '2',
        customerName: 'Priya',
        orderType: 'dine-in',
        items: [
          { name: 'Gulab Jamun Cheesecake', price: 150, quantity: 1 }
        ],
        subtotal: 150,
        tax: 8,
        total: 158,
        status: 'Preparing',
        paymentMethod: 'upi',
        paymentStatus: 'verified',
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
      }
    ]
    setOrders(demoOrders.map((o) => normOrder(o, tableMap)))
  }, [isDemo, orders.length, tableMap])

  useEffect(() => {
    setOrdersLoading(true)
    loadOrders()
  }, [loadOrders])

  // Orders: real-time
  useEffect(() => {
    if (!restaurantId) return
    const socket = getSocket()
    joinAdmin(restaurantId, session?.access_token)

    const onNewOrder = (payload) => {
      const order = normOrder(payload?.order || payload, tableMap)
      setOrders((prev) => {
        if (prev.some((o) => String(o.id) === String(order.id))) return prev
        return [order, ...prev]
      })
      if (!mutedRef.current) playAlert()
      push({
        type: 'order',
        title: `New order · ${orderTitle(order)}`,
        message: `${order.items.length} item(s) · ${inr(order.total)}`
      })
    }

    const onStatusUpdated = (payload) => {
      const { orderId, status, paymentStatus } = payload || {}
      if (!orderId) return
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(orderId)
            ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) }
            : o
        )
      )
    }

    socket.on('new_order', onNewOrder)
    socket.on('order_status_updated', onStatusUpdated)
    return () => {
      socket.off('new_order', onNewOrder)
      socket.off('order_status_updated', onStatusUpdated)
    }
  }, [restaurantId, session?.access_token, push, tableMap])

  const advanceOrder = async (order, next) => {
    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)))
    try {
      await api.patch(`/api/orders/${order.id}`, { status: next })
    } catch {
      // Revert on failure
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: order.status } : o))
      )
      push({ type: 'error', title: 'Update failed', message: 'Could not change order status.' })
    }
  }

  // Kitchen resolves an unverified UPI order: "verify" (money landed on their
  // phone) or "reject" (no payment arrived → order cancelled, never cooked).
  const resolvePayment = async (order, action) => {
    const prev = orders
    if (action === 'verify') {
      setOrders((p) => p.map((o) => (o.id === order.id ? { ...o, paymentStatus: 'verified' } : o)))
    } else {
      setOrders((p) => p.filter((o) => o.id !== order.id))
    }
    try {
      await api.patch(`/api/orders/${order.id}/payment`, { action })
    } catch {
      setOrders(prev)
      push({ type: 'error', title: 'Update failed', message: 'Could not update payment.' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 p-6">
        <Skeleton className="h-16 max-w-6xl mx-auto mb-6" />
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <Skeleton key={k} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center px-6">
        <EmptyState
          icon={AlertTriangle}
          title="Restaurant not found"
          subtitle={error || `No restaurant found for slug "${slug}". Seed the backend first.`}
        />
      </div>
    )
  }

  const tabs = [
    { id: 'orders', label: 'Live Orders', icon: ClipboardList },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'tables', label: 'Tables & QR', icon: QrCode },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'payments', label: 'Payments', icon: Wallet }
  ]

  const pendingCount = orders.filter((o) => o.status === 'Pending').length

  return (
    <Page className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-stone-950 text-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center font-black text-lg shrink-0">
            {restaurant.name?.[0] || 'O'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-lg truncate leading-tight">{restaurant.name}</h1>
            <p className="text-xs text-white/60">Admin dashboard</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-white/70 bg-white/10 rounded-full px-3 py-1.5">
            <Clock size={14} />
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            className={`p-2.5 rounded-full transition-colors ${
              muted ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={muted ? 'Unmute order alerts' : 'Mute order alerts'}
            aria-label={muted ? 'Unmute order alerts' : 'Mute order alerts'}
          >
            {muted ? <BellOff size={18} /> : <BellRing size={18} />}
          </button>
          {!isDemo && (
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                  tab === t.id ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                <t.icon size={16} />
                {t.label}
                {t.id === 'orders' && pendingCount > 0 && (
                  <span className="bg-brand-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
                {tab === t.id && (
                  <motion.div
                    layoutId="admin-tab"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'orders' && (
              <OrdersTab
                orders={orders}
                loading={ordersLoading}
                onAdvance={advanceOrder}
                onResolvePayment={resolvePayment}
                onRefresh={loadOrders}
              />
            )}
            {tab === 'menu' && <MenuTab restaurantId={restaurantId} />}
            {tab === 'tables' && <TablesTab restaurantId={restaurantId} slug={slug} />}
            {tab === 'analytics' && <AnalyticsTab restaurantId={restaurantId} />}
            {tab === 'payments' && <PaymentsTab slug={slug} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </Page>
  )
}

/* ================= Live Orders ================= */
function OrdersTab({ orders, loading, onAdvance, onResolvePayment, onRefresh }) {
  const [filter, setFilter] = useState('active')

  const visible = useMemo(() => {
    if (filter === 'all') return orders
    if (filter === 'active')
      return orders.filter((o) => !['Completed', 'Cancelled'].includes(o.status))
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  const filters = ['active', 'all', 'Pending', 'Preparing', 'Served', 'Completed', 'Cancelled']

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                filter === f ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-full bg-white hover:bg-stone-200 text-stone-600 shrink-0 ml-2"
          title="Refresh orders"
          aria-label="Refresh orders"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((k) => (
            <Skeleton key={k} className="h-56" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders here"
          subtitle="New orders from customer phones will appear here instantly."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {visible.map((o) => (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-card border border-stone-200/70 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-extrabold text-lg">{orderTitle(o)}</span>
                  <StatusPill status={o.status} />
                </div>
                {o.paymentMethod === 'upi' && (
                  <div className="mb-3">
                    {o.paymentStatus === 'verified' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                        <Check size={13} /> UPI · Verified
                      </span>
                    ) : (
                      <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-amber-800">
                          UPI · Unverified{o.paymentRef ? ` · ${o.paymentRef}` : ''}
                        </span>
                        <span className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => onResolvePayment(o, 'verify')}
                            className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-full px-3 py-1.5 active:scale-95 transition-transform"
                          >
                            Mark paid
                          </button>
                          <button
                            onClick={() => onResolvePayment(o, 'reject')}
                            className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full px-3 py-1.5 active:scale-95 transition-transform"
                          >
                            Not received
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1.5 text-sm max-h-36 overflow-y-auto pr-1">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="text-stone-600 truncate">
                        <span className="font-bold text-stone-900">{i.quantity ?? i.qty ?? 1}×</span>{' '}
                        {i.name}
                      </span>
                      <span className="font-semibold shrink-0">
                        {inr((Number(i.price) || 0) * (i.quantity ?? i.qty ?? 1))}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-stone-200">
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Clock size={12} /> {fmtTime(o.createdAt)}
                  </span>
                  <span className="font-extrabold text-lg">{inr(o.total)}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  {NEXT_STATUS[o.status] && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => onAdvance(o, NEXT_STATUS[o.status])}
                    >
                      Mark {NEXT_STATUS[o.status]}
                    </Button>
                  )}
                  {!['Completed', 'Cancelled'].includes(o.status) && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(`Cancel the order from ${orderTitle(o)}?`)) {
                          onAdvance(o, 'Cancelled')
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

/* ================= Payments (PayU + UPI) ================= */
// Per-cafe PayU status. Each cafe uses its OWN PayU merchant account so money
// settles into its own bank — the salt is never sent to the frontend.
function PayuStatusCard({ slug, refreshKey }) {
  const [info, setInfo] = React.useState(null)
  React.useEffect(() => {
    let alive = true
    api
      .get(`/api/restaurant/${slug}/payu`)
      .then((res) => alive && setInfo(res.data))
      .catch(() => alive && setInfo({ configured: false, source: 'none', testMode: true }))
    return () => {
      alive = false
    }
  }, [slug, refreshKey])

  const auto = info?.configured || info?.source === 'env'
  const testMode = info?.testMode !== false
  return (
    <div
      className={`rounded-2xl border p-5 mb-4 ${
        auto ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
      }`}
    >
      <p className={`font-extrabold text-sm flex items-center gap-2 ${auto ? 'text-emerald-800' : 'text-amber-800'}`}>
        <ShieldCheck size={16} />
        {info === null
          ? 'Checking payment mode…'
          : auto
            ? `Automatic online payments are ON (PayU${testMode ? ' · test mode' : ' · LIVE'})`
            : 'Manual UPI verification mode'}
      </p>
      <p className={`text-xs mt-1 leading-relaxed ${auto ? 'text-emerald-700' : 'text-amber-700'}`}>
        {info === null
          ? ''
          : auto
            ? info.source === 'restaurant'
              ? `Using this cafe's own PayU account${info.keyPreview ? ` (${info.keyPreview})` : ''} — money settles directly into your bank. The manual QR + Mark paid flow stays as backup.`
              : 'Using the platform fallback keys from the server env. Save your own PayU credentials below so payments settle into your account.'
            : 'No PayU credentials for this cafe — customers pay via QR and you tap Mark paid per order. Paste your PayU key + salt below to enable automatic payments.'}
      </p>
    </div>
  )
}

// Owner pastes their own PayU merchant key/salt + test/live toggle.
// Money settles into THIS cafe's bank account; other cafes never see it.
function PayuCredsCard({ slug, onSaved }) {
  const { push } = useToasts()
  const [key, setKey] = useState('')
  const [salt, setSalt] = useState('')
  const [testMode, setTestMode] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSalt, setShowSalt] = useState(false)

  const save = async () => {
    if (!key.trim() || !salt) {
      push({ type: 'error', title: 'Missing fields', message: 'Paste both the merchant key and the salt from your PayU dashboard.' })
      return
    }
    setSaving(true)
    try {
      await api.patch(`/api/restaurant/${slug}/payu`, { key: key.trim(), salt, testMode })
      setSalt('')
      push({ type: 'success', title: 'Saved', message: `Online payments ${testMode ? '(test mode)' : '(LIVE)'} enabled for this cafe.` })
      onSaved?.()
    } catch (err) {
      push({ type: 'error', title: 'Save failed', message: err.response?.data?.error || 'Could not save PayU credentials.' })
    } finally {
      setSaving(false)
    }
  }

  const clear = async () => {
    if (!window.confirm("Remove this cafe's PayU credentials? It will fall back to the platform keys.")) return
    setSaving(true)
    try {
      await api.patch(`/api/restaurant/${slug}/payu`, { key: '' })
      setKey('')
      push({ type: 'success', title: 'Removed', message: 'Cafe PayU credentials cleared.' })
      onSaved?.()
    } catch (err) {
      push({ type: 'error', title: 'Remove failed', message: err.response?.data?.error || 'Could not clear credentials.' })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-mono'
  return (
    <div className="bg-white rounded-2xl shadow-card border border-stone-200/70 p-6 mb-4">
      <h2 className="font-extrabold text-lg flex items-center gap-2">
        <ShieldCheck size={20} className="text-brand-600" /> PayU online payments
      </h2>
      <p className="text-sm text-stone-500 mt-1 leading-relaxed">
        Paste <b>your own</b> PayU merchant key + salt (PayU dashboard → Account). Customer
        payments settle <b>directly into your bank account</b> — other cafes never see or
        touch them. The salt is encrypted on the server and never shown again.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-stone-500">Merchant key</label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g. gtKFFx"
            className={`${inputCls} mt-1.5`}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-stone-500">Merchant salt</label>
          <div className="relative mt-1.5">
            <input
              type={showSalt ? 'text' : 'password'}
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="Paste salt (kept secret)"
              className={`${inputCls} pr-16`}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowSalt((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 hover:text-stone-700"
            >
              {showSalt ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="w-4 h-4 accent-orange-600"
          />
          Test mode <span className="text-stone-500 font-normal">(uncheck only after PayU KYC approval, for LIVE payments)</span>
        </label>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save PayU credentials'}</Button>
          <Button variant="secondary" onClick={clear} disabled={saving}>Remove</Button>
        </div>
      </div>
    </div>
  )
}

function PaymentsTab({ slug }) {
  const { push } = useToasts()
  const [upiId, setUpiId] = useState('')
  const [savedUpiId, setSavedUpiId] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .get(`/api/restaurant/${slug}`)
      .then((res) => {
        if (!alive) return
        const r = res.data?.restaurant || res.data
        setUpiId(r?.upiId || '')
        setSavedUpiId(r?.upiId || '')
        setRestaurantName(r?.name || '')
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  const save = async () => {
    setSaving(true)
    try {
      const res = await api.patch(`/api/restaurant/${slug}/upi`, { upiId: upiId.trim() })
      const r = res.data?.restaurant || res.data
      setSavedUpiId(r?.upiId || upiId.trim())
      push({ type: 'success', title: 'Saved', message: 'UPI ID updated. Customers will pay to this ID.' })
    } catch (err) {
      push({
        type: 'error',
        title: 'Save failed',
        message: err.response?.data?.error || 'Could not save UPI ID.'
      })
    } finally {
      setSaving(false)
    }
  }

  const previewLink = savedUpiId
    ? `upi://pay?pa=${savedUpiId}&pn=${encodeURIComponent(restaurantName || 'Restaurant')}&cu=INR`
    : ''

  const [payuRefresh, setPayuRefresh] = useState(0)

  return (
    <div className="max-w-xl">
      <PayuStatusCard slug={slug} refreshKey={payuRefresh} />
      <PayuCredsCard slug={slug} onSaved={() => setPayuRefresh((k) => k + 1)} />
      <div className="bg-white rounded-2xl shadow-card border border-stone-200/70 p-6">
        <h2 className="font-extrabold text-lg flex items-center gap-2">
          <Wallet size={20} className="text-brand-600" /> UPI payments
        </h2>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          Enter the UPI ID that customer payments should go to. At checkout, customers see a
          QR with the exact bill amount and a reference code — you confirm each payment from
          the UPI notification on your phone, then tap <b>Mark paid</b> on the order.
        </p>

        {loading ? (
          <Skeleton className="h-12 mt-4" />
        ) : (
          <div className="mt-4">
            <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Your UPI ID
            </label>
            <div className="flex gap-2 mt-1.5">
              <input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@okhdfcbank"
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              <Button size="md" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {!savedUpiId && (
              <p className="text-xs text-amber-600 font-semibold mt-2">
                No UPI ID saved — customers will only see "pay at counter".
              </p>
            )}
          </div>
        )}

        {previewLink && (
          <div className="mt-6 flex items-center gap-5 bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <div className="bg-white p-2.5 rounded-xl border border-stone-200 shrink-0">
              <QRCodeSVG value={previewLink} size={110} level="M" />
            </div>
            <div className="text-sm">
              <p className="font-bold">What customers see</p>
              <p className="text-stone-500 mt-1 leading-relaxed text-[13px]">
                A fresh QR per order with the bill amount pre-filled and a reference like{' '}
                <span className="font-bold text-stone-700">T5-8K2Q</span> in the payment note —
                match it with the notification on your phone.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================= Menu management ================= */
const EMPTY_DISH = { name: '', description: '', price: '', category: '', imageUrl: '', available: true }

function MenuTab({ restaurantId }) {
  const { push } = useToasts()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_DISH)
  const [editing, setEditing] = useState(null) // dish being edited
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!restaurantId) return
    try {
      const res = await api.get('/api/menu', { params: { restaurant: restaurantId } })
      const list = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.menu || []
      setItems(list.map(normDish))
    } catch (err) {
      push({ type: 'error', title: 'Menu failed to load', message: err.friendlyMessage })
    } finally {
      setLoading(false)
    }
  }, [restaurantId, push])

  useEffect(() => {
    load()
  }, [load])

  // Stay in sync when other devices change the menu
  useEffect(() => {
    const socket = getSocket()
    const onMenuUpdated = (payload) => {
      if (!payload?.restaurantId || String(payload.restaurantId) === String(restaurantId)) load()
    }
    socket.on('menu_updated', onMenuUpdated)
    return () => socket.off('menu_updated', onMenuUpdated)
  }, [restaurantId, load])

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).filter(Boolean),
    [items]
  )

  const filtered = items.filter(
    (i) =>
      !query.trim() ||
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.category.toLowerCase().includes(query.toLowerCase())
  )

  const saveDish = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    const payload = {
      restaurantId,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim() || 'Other',
      imageUrl: form.imageUrl.trim(),
      available: form.available
    }
    try {
      if (editing) {
        await api.patch(`/api/menu/${editing.id}`, payload)
        setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...normDish({ ...payload, _id: editing.id }) } : i)))
        push({ type: 'success', title: 'Dish updated' })
      } else {
        const res = await api.post('/api/menu', payload)
        const created = normDish(res.data?.item || res.data?.dish || res.data)
        setItems((prev) => [created, ...prev])
        push({ type: 'success', title: 'Dish added', message: created.name })
      }
      setForm(EMPTY_DISH)
      setEditing(null)
      setShowAdd(false)
    } catch (err) {
      push({ type: 'error', title: 'Save failed', message: err.friendlyMessage })
    } finally {
      setSaving(false)
    }
  }

  const toggleStock = async (dish) => {
    setItems((prev) => prev.map((i) => (i.id === dish.id ? { ...i, available: !i.available } : i)))
    try {
      await api.patch(`/api/menu/${dish.id}`, { available: !dish.available })
    } catch {
      setItems((prev) => prev.map((i) => (i.id === dish.id ? { ...i, available: dish.available } : i)))
      push({ type: 'error', title: 'Toggle failed', message: 'Could not update stock status.' })
    }
  }

  const deleteDish = async (dish) => {
    if (!window.confirm(`Delete "${dish.name}" from the menu?`)) return
    try {
      await api.delete(`/api/menu/${dish.id}`)
      setItems((prev) => prev.filter((i) => i.id !== dish.id))
      push({ type: 'success', title: 'Dish deleted', message: dish.name })
    } catch (err) {
      push({ type: 'error', title: 'Delete failed', message: err.friendlyMessage })
    }
  }

  const startEdit = (dish) => {
    setEditing(dish)
    setForm({
      name: dish.name,
      description: dish.description,
      price: String(dish.price),
      category: dish.category,
      imageUrl: dish.imageUrl,
      available: dish.available
    })
    setShowAdd(true)
  }

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl bg-stone-100 border border-transparent focus:border-brand-400 focus:bg-white outline-none text-sm'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 outline-none text-sm focus:border-brand-400"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setForm(EMPTY_DISH)
            setShowAdd((s) => !s)
          }}
        >
          <Plus size={16} /> {showAdd ? 'Close' : 'Add dish'}
        </Button>
      </div>

      {/* Add / edit form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={saveDish}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-card border border-stone-200/70 p-5 mb-5">
              <h3 className="font-bold mb-4">{editing ? 'Edit dish' : 'New dish'}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  className={inputCls}
                  placeholder="Dish name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  className={inputCls}
                  placeholder="Price (₹) *"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
                <input
                  className={inputCls}
                  placeholder="Category (e.g. Burgers)"
                  list="ok-categories"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
                <datalist id="ok-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <input
                  className={inputCls}
                  placeholder="Image URL (optional)"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
                <input
                  className={`${inputCls} sm:col-span-2`}
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })}
                    className="w-4 h-4 accent-orange-600"
                  />
                  In stock
                </label>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Add dish'}
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((k) => (
            <Skeleton key={k} className="h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No dishes yet"
          subtitle="Add your first dish to publish it to customer phones instantly."
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-stone-200/70 overflow-hidden">
          {filtered.map((d, idx) => (
            <div
              key={d.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                idx !== filtered.length - 1 ? 'border-b border-stone-100' : ''
              } ${d.available ? '' : 'bg-stone-50'}`}
            >
              <DishImage src={d.imageUrl} alt={d.name} width={48} height={48} className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{d.name}</p>
                <p className="text-xs text-stone-500">
                  {d.category} · {inr(d.price)}
                </p>
              </div>
              <button
                onClick={() => toggleStock(d)}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                  d.available
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}
                title="Toggle stock status"
              >
                {d.available ? 'In stock' : 'Out of stock'}
              </button>
              <button
                onClick={() => startEdit(d)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-500 shrink-0"
                title="Edit dish"
                aria-label={`Edit ${d.name}`}
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => deleteDish(d)}
                className="p-2 rounded-full hover:bg-red-50 text-stone-400 hover:text-red-600 shrink-0"
                title="Delete dish"
                aria-label={`Delete ${d.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================= Tables & QR ================= */
function TablesTab({ restaurantId, slug }) {
  const { push } = useToasts()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [newNumber, setNewNumber] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .get('/api/tables', { params: { restaurant: restaurantId } })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : res.data?.tables || []
        setTables(list)
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [restaurantId])

  const addTable = async (e) => {
    e.preventDefault()
    const tableNumber = newNumber.trim()
    if (!tableNumber) return
    setAdding(true)
    try {
      const res = await api.post('/api/tables', { restaurantId, tableNumber })
      const created = res.data?.table || res.data
      setTables((prev) => [...prev, created])
      setNewNumber('')
      push({
        type: 'success',
        title: 'Table added',
        message: `Table ${created.tableNumber ?? tableNumber} is ready for its QR code.`
      })
    } catch (err) {
      push({ type: 'error', title: 'Add failed', message: err.friendlyMessage })
    } finally {
      setAdding(false)
    }
  }

  const deleteTable = async (t) => {
    const tableId = t._id || t.id
    const label = t.tableNumber ?? t.number ?? t.name ?? 'this table'
    if (!window.confirm(`Delete Table ${label}? Its QR code will stop working.`)) return
    try {
      await api.delete(`/api/tables/${tableId}`)
      setTables((prev) => prev.filter((x) => String(x._id || x.id) !== String(tableId)))
      push({ type: 'success', title: 'Table deleted', message: `Table ${label} removed.` })
    } catch (err) {
      push({ type: 'error', title: 'Delete failed', message: err.friendlyMessage })
    }
  }

  const copyLink = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(id)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      push({ type: 'error', title: 'Copy failed', message: 'Clipboard unavailable in this browser.' })
    }
  }

  return (
    <div>
      {import.meta.env.DEV && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800 mb-5 flex gap-2.5">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>
            Print these QR codes and place one on each table. <strong>Dev note:</strong> phones
            can't reach <code className="bg-amber-100 px-1 rounded">localhost</code> — serve the
            frontend on your LAN IP (e.g. <code className="bg-amber-100 px-1 rounded">http://192.168.1.5:5173</code>)
            so scanned links open on customer phones.
          </p>
        </div>
      )}

      {/* Add table */}
      <form onSubmit={addTable} className="flex gap-2 mb-5 max-w-md">
        <input
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          placeholder="Table number (e.g. 5)"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-stone-200 outline-none text-sm focus:border-brand-400"
        />
        <Button type="submit" disabled={adding || !newNumber.trim()}>
          <Plus size={16} /> {adding ? 'Adding...' : 'Add table'}
        </Button>
      </form>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((k) => (
            <Skeleton key={k} className="h-72" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No tables yet"
          subtitle="Add your first table above to generate its QR code."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((t) => {
            const tableId = t._id || t.id
            const number = t.tableNumber ?? t.number ?? t.name ?? String(tableId).slice(-4)
            const url = `${window.location.origin}/c/${slug}/t/${tableId}`
            return (
              <div
                key={tableId}
                className="bg-white rounded-2xl shadow-card border border-stone-200/70 p-5 flex flex-col items-center"
              >
                <div className="w-full flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-lg">Table {number}</h3>
                  <button
                    onClick={() => deleteTable(t)}
                    className="p-2 rounded-full hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                    title="Delete table"
                    aria-label={`Delete Table ${number}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-stone-900">
                  <QRCodeSVG value={url} size={160} level="M" />
                </div>
                <p className="text-xs text-stone-500 mt-3 break-all text-center font-mono">{url}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => copyLink(url, tableId)}
                >
                  {copied === tableId ? (
                    <>
                      <Check size={14} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy link
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ================= Analytics ================= */
function AnalyticsTab({ restaurantId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/analytics', { params: { restaurant: restaurantId } })
      const d = res.data?.analytics || res.data || {}
      setData({
        totalRevenue: d.totalRevenue ?? d.revenue ?? 0,
        pendingOrders: d.pendingOrders ?? d.pending ?? 0,
        preparingOrders: d.preparingOrders ?? d.preparing ?? 0,
        activeMenuItems: d.activeMenuItems ?? d.activeItems ?? d.menuItems ?? 0
      })
      setLastUpdated(new Date())
    } catch {
      /* keep old data */
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const cards = [
    { label: 'Total revenue', value: inr(data?.totalRevenue || 0), icon: IndianRupee, tint: 'bg-emerald-100 text-emerald-700' },
    { label: 'Pending orders', value: data?.pendingOrders ?? 0, icon: Hourglass, tint: 'bg-amber-100 text-amber-700' },
    { label: 'Preparing now', value: data?.preparingOrders ?? 0, icon: Flame, tint: 'bg-blue-100 text-blue-700' },
    { label: 'Active menu items', value: data?.activeMenuItems ?? 0, icon: CircleCheck, tint: 'bg-violet-100 text-violet-700' }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString('en-IN')}`
            : 'Loading...'}
          <span className="text-stone-500"> · auto-refreshes every 30s</span>
        </p>
        <button
          onClick={load}
          className="p-2 rounded-full bg-white hover:bg-stone-200 text-stone-600"
          title="Refresh analytics"
          aria-label="Refresh analytics"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-32" />)
          : cards.map((c) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-card border border-stone-200/70 p-5"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.tint}`}>
                  <c.icon size={20} />
                </div>
                <p className="text-2xl font-black">{c.value}</p>
                <p className="text-xs font-semibold text-stone-500 mt-1 uppercase tracking-wide">
                  {c.label}
                </p>
              </motion.div>
            ))}
      </div>
    </div>
  )
}
