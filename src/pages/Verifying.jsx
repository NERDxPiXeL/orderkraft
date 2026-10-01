import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Loader2, ShieldCheck, XCircle, Timer } from 'lucide-react'
import api from '../api.js'
import { getSocket, joinTable } from '../socket.js'
import { Page, Button, Skeleton, EmptyState, inr } from '../components/ui.jsx'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function Verifying() {
  const { slug, tableId, orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [gateway, setGateway] = useState(null) // 'payu' | 'manual'
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  // Load order + restaurant (for the UPI id behind the QR) + gateway mode
  useEffect(() => {
    let alive = true
    Promise.all([
      api.get(`/api/orders/${orderId}`).then((r) => r.data).catch(() => null),
      api.get(`/api/restaurant/${slug}`).then((r) => r.data?.restaurant || r.data).catch(() => null),
      api.get('/api/payments/status').then((r) => r.data?.gateway).catch(() => 'manual')
    ]).then(([o, r, g]) => {
      if (!alive) return
      setOrder(o)
      setRestaurant(r)
      setGateway(g === 'payu' ? 'payu' : 'manual')
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [orderId, slug])

  // Countdown from the server-set expiry
  useEffect(() => {
    if (!order?.paymentExpiresAt) return
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(order.paymentExpiresAt) - Date.now()) / 1000))
      setSecondsLeft(left)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [order?.paymentExpiresAt])

  // Already resolved? Route accordingly.
  useEffect(() => {
    if (!order) return
    if (order.paymentStatus === 'verified') navigate(`/c/${slug}/t/${tableId}/track/${orderId}`, { replace: true })
  }, [order, slug, tableId, orderId, navigate])

  // Live: kitchen verifies / rejects / expiry sweeper → react instantly
  useEffect(() => {
    const socket = getSocket()
    joinTable(tableId)
    const onStatus = (payload) => {
      if (String(payload?.orderId) !== String(orderId)) return
      if (payload.paymentStatus === 'verified') {
        navigate(`/c/${slug}/t/${tableId}/track/${orderId}`)
      } else if (payload.status === 'Cancelled') {
        setOrder((prev) => (prev ? { ...prev, status: 'Cancelled', paymentStatus: payload.paymentStatus || prev.paymentStatus } : prev))
      }
    }
    socket.on('order_status_updated', onStatus)
    return () => {
      socket.off('order_status_updated', onStatus)
    }
  }, [orderId, tableId, slug, navigate])

  const cancelOrder = async () => {
    if (cancelling) return
    setCancelling(true)
    try {
      await api.post(`/api/orders/${orderId}/cancel`, { tableId })
      setOrder((prev) => (prev ? { ...prev, status: 'Cancelled', paymentStatus: 'cancelled' } : prev))
    } catch {
      setCancelling(false)
    }
  }

  // Gateway mode: fetch the PayU form data, then auto-submit it to PayU.
  // PayU takes the customer to its payment page and POSTs the result back to
  // our backend (surl/furl), which redirects into order tracking.
  const [payuForm, setPayuForm] = useState(null) // { actionUrl, fields }
  const formRef = React.useRef(null)

  const startPayU = async () => {
    if (paying) return
    setPaying(true)
    setPayError('')
    try {
      const { data } = await api.post('/api/payments/payu/order', { orderId })
      if (data.alreadyPaid) {
        navigate(`/c/${slug}/t/${tableId}/track/${orderId}`)
        return
      }
      setPayuForm(data) // the effect below submits the hidden form
    } catch (err) {
      setPayError(err.friendlyMessage || err.message || 'Could not start payment. Try again.')
      setPaying(false)
    }
  }

  useEffect(() => {
    if (payuForm && formRef.current) formRef.current.submit()
  }, [payuForm])

  // Gateway mode: start the PayU redirect automatically once loaded — unless
  // we just came back from a failed payment (?failed=1), in which case the
  // customer retries manually.
  const autoOpened = React.useRef(false)
  const cameBackFailed = new URLSearchParams(window.location.search).get('failed') === '1'
  useEffect(() => {
    if (cameBackFailed && !payError) setPayError('Payment failed or was cancelled. Your order is still reserved — try again.')
    if (
      gateway === 'payu' &&
      !autoOpened.current &&
      !cameBackFailed &&
      order &&
      order.paymentStatus === 'unverified' &&
      order.status !== 'Cancelled'
    ) {
      autoOpened.current = true
      startPayU()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, order])

  const upiId = restaurant?.upiId || ''
  const upiLink = useMemo(() => {
    if (!upiId || !order) return ''
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(restaurant?.name || 'Restaurant')}&am=${Number(order.total || 0).toFixed(2)}&cu=INR&tn=${order.paymentRef || ''}`
  }, [upiId, order, restaurant])

  const dead = order && (order.status === 'Cancelled' || secondsLeft === 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 max-w-md mx-auto px-5 pt-10 space-y-4 font-display">
        <Skeleton className="h-8 w-2/3 !rounded-full" />
        <Skeleton className="h-64 !rounded-[2rem]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6 font-display">
        <EmptyState
          title="Order not found"
          subtitle="This order link doesn't look right."
          action={
            <Link to={`/c/${slug}/t/${tableId}/menu`}>
              <Button className="!rounded-full">Back to Menu</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (dead) {
    const expired = order.paymentStatus === 'expired' || secondsLeft === 0
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6 font-display">
        <div className="bg-white rounded-[2rem] shadow-warm border border-orange-100/60 p-8 text-center max-w-sm">
          <span className="w-16 h-16 rounded-3xl bg-red-100 text-red-500 inline-flex items-center justify-center">
            <XCircle size={30} />
          </span>
          <h1 className="font-extrabold text-xl text-stone-900 mt-4">
            {expired ? 'Payment window expired' : 'Order cancelled'}
          </h1>
          <p className="text-sm text-stone-500 font-medium mt-2 leading-relaxed">
            {expired
              ? 'We never got a payment confirmation within 10 minutes, so this order was cancelled. No money was taken by us.'
              : 'This order was cancelled before the payment was confirmed.'}
          </p>
          <Link to={`/c/${slug}/t/${tableId}/menu`} className="block mt-6">
            <Button size="lg" className="w-full !rounded-full">
              Back to Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Page className="min-h-screen bg-cream-50 pb-10 font-display">
      <div className="max-w-md mx-auto px-5 pt-8">
        <div className="bg-white rounded-[2rem] shadow-warm border border-orange-100/60 p-7 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-4 py-1.5">
            <Loader2 size={13} className="animate-spin" /> Verifying payment
          </span>

          {gateway === 'payu' ? (
            <div className="mt-6">
              {payError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 font-semibold mb-3">
                  {payError}
                </div>
              )}
              <Button size="lg" className="w-full !rounded-full" onClick={startPayU} disabled={paying}>
                {paying ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  `Pay ${inr(order.total)} now`
                )}
              </Button>
              <p className="text-[11px] text-stone-500 mt-2">
                UPI, cards & netbanking · secured by PayU
              </p>
              {/* Hidden form: auto-submitted to PayU when payuForm arrives. */}
              {payuForm && (
                <form ref={formRef} action={payuForm.actionUrl} method="post" style={{ display: 'none' }}>
                  {Object.entries(payuForm.fields).map(([k, v]) => (
                    <input key={k} type="hidden" name={k} value={v} />
                  ))}
                </form>
              )}
            </div>
          ) : upiLink ? (
            <>
              <p className="text-xs font-bold text-stone-500 mt-5 mb-2">
                Haven't paid yet? Scan with any UPI app
              </p>
              <div className="bg-white rounded-3xl border-2 border-orange-100 p-4 inline-block shadow-warm">
                <QRCodeSVG value={upiLink} size={170} level="M" />
              </div>
            </>
          ) : null}

          <p className="font-extrabold text-3xl text-stone-900 mt-5">{inr(order.total)}</p>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            Order <span className="font-bold text-stone-700">#{String(order._id || order.id).slice(-6).toUpperCase()}</span>
            {order.paymentRef ? (
              <> · UPI ref <span className="font-bold text-stone-700">{order.paymentRef}</span></>
            ) : null}
          </p>

          <div className="mt-5 bg-cream-100/70 rounded-2xl px-4 py-3 text-sm text-stone-600 font-medium leading-relaxed">
            {gateway === 'payu'
              ? 'You will be taken to PayU to complete the payment — you will return here automatically.'
              : 'Complete the payment in your UPI app — the kitchen is matching your payment reference and will confirm it any second.'}
          </div>

          {secondsLeft !== null && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
              <Timer size={14} /> {fmt(secondsLeft)} left
            </p>
          )}
        </div>

        <button
          onClick={cancelOrder}
          disabled={cancelling}
          className="w-full text-center text-xs font-bold text-stone-500 hover:text-red-500 mt-5 py-2 transition-colors disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : "Changed your mind? Cancel this order"}
        </button>

        <p className="text-[11px] text-stone-500 mt-1 text-center flex items-center justify-center gap-1">
          <ShieldCheck size={12} className="text-emerald-500" />
          Your order reaches the kitchen only after payment is confirmed
        </p>
      </div>
    </Page>
  )
}
