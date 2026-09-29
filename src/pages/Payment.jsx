import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Loader2, Banknote, QrCode, UtensilsCrossed, ShoppingBag } from 'lucide-react'
import api from '../api.js'
import { useCart } from '../CartContext.jsx'
import { Page, Button, Skeleton, EmptyState, inr } from '../components/ui.jsx'
import useTableLabel from '../hooks/useTableLabel.js'

const GST_RATE = 0.05

// Short payment reference baked into the UPI note so the kitchen can match
// the "money received" notification to this order. e.g. T5-8K2Q
const makeRef = (tableId) => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `T${tableId}-${s}`
}

export default function Payment() {
  const { slug, tableId } = useParams()
  const navigate = useNavigate()
  const cart = useCart()

  const [restaurant, setRestaurant] = useState(null)
  const [restaurantId, setRestaurantId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [method, setMethod] = useState(null) // null | 'counter'
  const [gateway, setGateway] = useState(null) // 'payu' | 'manual'
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState('dine-in') // 'dine-in' | 'takeaway'
  const tableLabel = useTableLabel(restaurant?._id || restaurant?.id, tableId)

  const subtotal = cart.subtotal
  const tax = Math.round(subtotal * GST_RATE)
  const total = subtotal + tax

  useEffect(() => {
    let alive = true
    api
      .get(`/api/restaurant/${slug}`)
      .then((res) => {
        if (!alive) return
        const r = res.data?.restaurant || res.data
        setRestaurant(r)
        if (r) {
          const rid = r._id || r.id
          setRestaurantId(rid)
          cart.setRestaurantId(rid)
          // Per-cafe payment mode: this cafe's own PayU creds, else manual.
          api
            .get('/api/payments/status', { params: { restaurant: rid } })
            .then((sres) => alive && setGateway(sres.data?.gateway === 'payu' ? 'payu' : 'manual'))
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const upiId = restaurant?.upiId || ''
  // Gateway mode doesn't need the manual UPI id at all.
  const upiAvailable = gateway === 'payu' ? true : Boolean(upiId)

  const buildPayload = (paymentMethod) => ({
    restaurantId,
    tableId,
    items: cart.items.map((i) => ({
      menuItemId: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty
    })),
    subtotal,
    tax,
    total,
    paymentMethod,
    paymentRef: paymentMethod === 'upi' ? makeRef(tableId) : '',
    customerName: customerName.trim(),
    orderType
  })

  // UPI: the order is created immediately as "unverified" — no "I've paid"
  // button. The customer lands on the verifying screen; the kitchen confirms
  // the money manually and the customer auto-advances to order tracking.
  const payWithUpi = async () => {
    if (cart.items.length === 0 || placing || !upiAvailable || !customerName.trim()) return
    setPlacing(true)
    setError('')
    try {
      const res = await api.post('/api/orders', buildPayload('upi'))
      const order = res.data?.order || res.data
      const orderId = order?._id || order?.id || res.data?.orderId
      cart.clearCart()
      if (orderId) navigate(`/c/${slug}/t/${tableId}/verifying/${orderId}`)
      else navigate(`/c/${slug}/t/${tableId}/menu`)
    } catch (err) {
      setError(err.friendlyMessage || 'Could not start your order. Please try again.')
      setPlacing(false)
    }
  }

  const placeCounterOrder = async () => {
    if (cart.items.length === 0 || placing || !customerName.trim()) return
    setPlacing(true)
    setError('')
    try {
      const res = await api.post('/api/orders', buildPayload('counter'))
      const order = res.data?.order || res.data
      const orderId = order?._id || order?.id || res.data?.orderId
      cart.clearCart()
      if (orderId) navigate(`/c/${slug}/t/${tableId}/track/${orderId}`)
      else navigate(`/c/${slug}/t/${tableId}/menu`)
    } catch (err) {
      setError(err.friendlyMessage || 'Could not place your order. Please try again.')
      setPlacing(false)
    }
  }

  const goBack = () => {
    if (method) setMethod(null)
    else navigate(`/c/${slug}/t/${tableId}/cart`)
  }

  if (cart.items.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6 font-display">
        <EmptyState
          title="Nothing to pay for"
          subtitle="Your cart is empty."
          action={
            <Link to={`/c/${slug}/t/${tableId}/menu`}>
              <Button className="!rounded-full">Back to Menu</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <Page className="min-h-screen bg-cream-50 pb-10 font-display">
      <div className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur border-b border-orange-100/70">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
          <button
            onClick={goBack}
            className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-stone-600 active:scale-90 transition-transform"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-extrabold text-xl text-stone-900">Payment</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 !rounded-3xl" />
            <Skeleton className="h-20 !rounded-3xl" />
          </div>
        ) : method === null ? (
          /* ---------- STEP 1: choose a payment method ---------- */
          <>
            <div className="bg-white rounded-3xl shadow-warm border border-orange-100/60 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Total to pay
                </p>
                <p className="font-extrabold text-3xl text-stone-900 mt-1">{inr(total)}</p>
              </div>
              <div className="text-right text-xs text-stone-400 font-medium leading-relaxed">
                {cart.items.length} item{cart.items.length === 1 ? '' : 's'}
                <br />
                {tableLabel || 'Table …'}
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-bold text-stone-500 px-1">Your name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul"
                maxLength={60}
                className="mt-2 w-full bg-white rounded-2xl border-2 border-orange-100 px-5 py-3.5 font-semibold text-stone-900 placeholder:text-stone-300 outline-none focus:border-brand-300 transition-all"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-bold text-stone-500 px-1">Order type</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[
                  { value: 'dine-in', label: 'Dine-in', Icon: UtensilsCrossed },
                  { value: 'takeaway', label: 'Takeaway', Icon: ShoppingBag }
                ].map(({ value, label, Icon }) => {
                  const active = orderType === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOrderType(value)}
                      className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 font-bold text-sm transition-all active:scale-95 ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-warm'
                          : 'border-orange-100 bg-white text-stone-500'
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <p className="text-sm font-bold text-stone-500 mt-6 mb-3 px-1">
              How would you like to pay?
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 font-semibold mb-3">
                {error}
              </div>
            )}

            <button
              onClick={payWithUpi}
              disabled={!upiAvailable || placing || !customerName.trim()}
              className={`w-full text-left bg-white rounded-3xl border-2 p-5 flex items-center gap-4 transition-all active:scale-[0.98] ${
                upiAvailable && !placing && customerName.trim()
                  ? 'border-orange-100 shadow-warm hover:border-brand-300 cursor-pointer'
                  : 'border-stone-100 opacity-50 cursor-not-allowed'
              }`}
            >
              <span className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                {placing ? <Loader2 size={24} className="animate-spin" /> : <QrCode size={24} />}
              </span>
              <span className="flex-1">
                <span className="block font-extrabold text-stone-900">
                  {gateway === 'payu' ? 'Pay online' : 'Pay with UPI'}
                </span>
                <span className="block text-xs text-stone-500 font-medium mt-0.5">
                  {gateway === 'payu'
                    ? 'UPI, cards & more — payment confirmed automatically'
                    : upiAvailable
                      ? 'Scan the QR & pay instantly — the kitchen confirms it'
                      : 'Not available at this restaurant right now'}
                </span>
              </span>
              <ChevronLeft size={20} className="text-stone-300 rotate-180" />
            </button>

            <button
              onClick={() => setMethod('counter')}
              disabled={placing || !customerName.trim()}
              className="w-full text-left bg-white rounded-3xl border-2 border-orange-100 shadow-warm p-5 flex items-center gap-4 mt-3 hover:border-brand-300 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Banknote size={24} />
              </span>
              <span className="flex-1">
                <span className="block font-extrabold text-stone-900">Pay at Counter</span>
                <span className="block text-xs text-stone-500 font-medium mt-0.5">
                  Order now, pay cash or UPI at the counter
                </span>
              </span>
              <ChevronLeft size={20} className="text-stone-300 rotate-180" />
            </button>
          </>
        ) : (
          /* ---------- STEP 2: pay at counter confirm ---------- */
          <>
            <div className="bg-white rounded-[2rem] shadow-warm border border-orange-100/60 p-7 text-center">
              <span className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 inline-flex items-center justify-center">
                <Banknote size={30} />
              </span>
              <p className="font-extrabold text-3xl text-stone-900 mt-4">{inr(total)}</p>
              <p className="text-sm text-stone-500 font-medium mt-2 leading-relaxed">
                Your order goes to the kitchen right away.
                <br />
                Pay {inr(total)} at the counter — cash or UPI.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 font-semibold mt-4">
                {error}
              </div>
            )}

            <Button
              size="lg"
              className="w-full !rounded-full mt-4"
              onClick={placeCounterOrder}
              disabled={placing || !customerName.trim()}
            >
              {placing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Place Order · Pay at Counter'
              )}
            </Button>
          </>
        )}
      </div>
    </Page>
  )
}
