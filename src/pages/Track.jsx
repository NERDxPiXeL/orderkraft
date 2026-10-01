import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Armchair, Check, Clock, ChefHat, BellRing, PackageCheck, XCircle, UtensilsCrossed } from 'lucide-react'
import api from '../api.js'
import { getSocket, joinTable } from '../socket.js'
import { Page, Button, Skeleton, EmptyState, DishImage, inr } from '../components/ui.jsx'
import useTableLabel from '../hooks/useTableLabel.js'

const STEPS = ['Pending', 'Preparing', 'Served', 'Completed']
const STEP_ICONS = [Clock, ChefHat, BellRing, PackageCheck]

async function fetchOrder(orderId, tableId) {
  // Prefer the single-order endpoint; fall back to the list if the backend only exposes that
  try {
    const res = await api.get(`/api/orders/${orderId}`)
    return res.data?.order || res.data
  } catch {
    const res = await api.get('/api/orders', { params: { table: tableId } })
    const list = Array.isArray(res.data) ? res.data : res.data?.orders || []
    return list.find((o) => String(o._id || o.id) === String(orderId)) || null
  }
}

export default function Track() {
  const { slug, tableId, orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const tableLabel = useTableLabel(order?.restaurantId, order?.tableId || tableId)

  useEffect(() => {
    let alive = true
    fetchOrder(orderId, tableId)
      .then((o) => {
        if (!alive) return
        if (!o) setError('Order not found.')
        // Still awaiting kitchen payment confirmation → verifying screen
        else if (o.paymentStatus === 'unverified') {
          navigate(`/c/${slug}/t/${tableId}/verifying/${orderId}`, { replace: true })
        } else setOrder(o)
      })
      .catch((err) => {
        if (alive) setError(err.friendlyMessage || 'Could not load your order.')
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [orderId, tableId])

  // Live status updates from the kitchen
  useEffect(() => {
    const socket = getSocket()
    joinTable(tableId)
    const onStatus = (payload) => {
      if (String(payload?.orderId) === String(orderId)) {
        setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev))
        // Re-fetch for full freshness (items snapshot, totals)
        fetchOrder(orderId, tableId).then((o) => o && setOrder(o)).catch(() => {})
      }
    }
    socket.on('order_status_updated', onStatus)
    return () => {
      socket.off('order_status_updated', onStatus)
    }
  }, [orderId, tableId])

  const status = order?.status || 'Pending'
  const stepIndex = STEPS.indexOf(status)
  const cancelled = status === 'Cancelled'
  const items = order?.items || []
  const total = order?.total ?? items.reduce((s, i) => s + (i.price || 0) * (i.quantity || i.qty || 1), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 max-w-md mx-auto px-5 pt-10 space-y-4">
        <Skeleton className="h-8 w-2/3 !rounded-full" />
        <Skeleton className="h-40 !rounded-[2rem]" />
        <Skeleton className="h-24 !rounded-[2rem]" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6">
        <EmptyState
          icon={UtensilsCrossed}
          title="Order not found"
          subtitle={error || 'This tracking link may be invalid.'}
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
      <div className="max-w-md mx-auto px-5 pt-10">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14 }}
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-glow ${
              cancelled ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'
            }`}
          >
            {cancelled ? <XCircle size={38} /> : <Check size={38} strokeWidth={3} />}
          </motion.div>
          <h1 className="text-3xl font-extrabold mt-5 text-stone-900 tracking-tight">
            {cancelled ? 'Order cancelled' : 'Order placed!'}
          </h1>
          <p className="text-sm text-stone-500 mt-2 flex items-center justify-center gap-1.5 font-medium">
            <Armchair size={14} className="text-brand-500" /> {tableLabel || 'Table …'}
            <span className="text-stone-300">·</span>
            <span className="font-bold text-stone-700">#{String(orderId).slice(-6).toUpperCase()}</span>
          </p>
        </div>

        {/* Stepper */}
        {!cancelled && (
          <div className="bg-white rounded-[2rem] shadow-warm border border-orange-100/60 p-6 mt-7">
            <div className="relative">
              <div className="absolute left-[21px] right-[21px] top-[21px] h-1 bg-orange-100 rounded-full" />
              <motion.div
                className="absolute left-[21px] top-[21px] h-1 bg-gradient-to-r from-brand-500 to-amber-400 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `calc(${Math.max(stepIndex, 0)} / ${STEPS.length - 1} * (100% - 42px))`
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <div className="relative flex justify-between">
                {STEPS.map((s, i) => {
                  const Icon = STEP_ICONS[i]
                  const done = i <= stepIndex
                  const active = i === stepIndex
                  return (
                    <div key={s} className="flex flex-col items-center w-16">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: active ? 1.18 : 1,
                          backgroundColor: done ? '#ea580c' : '#FFF3E4',
                          color: done ? '#ffffff' : '#c2a586'
                        }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="w-11 h-11 rounded-full flex items-center justify-center shadow-warm z-10"
                      >
                        <Icon size={20} />
                      </motion.div>
                      <span
                        className={`text-[11px] font-bold mt-2 text-center ${
                          done ? 'text-stone-800' : 'text-stone-500'
                        }`}
                      >
                        {s}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="text-center text-sm text-stone-500 mt-5 font-medium">
              {status === 'Completed'
                ? 'Enjoy your meal!'
                : status === 'Served'
                  ? 'Your food is on the way to your table.'
                  : status === 'Preparing'
                    ? 'The kitchen is cooking your order right now.'
                    : 'The kitchen has received your order.'}
            </p>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-[2rem] shadow-warm border border-orange-100/60 p-6 mt-4">
          <h2 className="font-extrabold mb-4 text-stone-900">Your items</h2>
          <div className="space-y-3">
            {items.map((i, idx) => {
              const qty = i.quantity ?? i.qty ?? 1
              return (
                <div key={idx} className="flex items-center gap-3">
                  <DishImage
                    src={i.image || i.imageUrl}
                    alt={i.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-2xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-stone-900">{i.name}</p>
                    <p className="text-xs text-stone-500 font-medium">× {qty}</p>
                  </div>
                  <p className="font-extrabold text-sm text-brand-600">{inr((i.price || 0) * qty)}</p>
                </div>
              )
            })}
          </div>
          <div className="border-t-2 border-dashed border-orange-200 mt-5 pt-4 flex justify-between items-center">
            <span className="font-extrabold text-stone-900">Total paid</span>
            <span className="font-extrabold text-2xl text-brand-600">{inr(total)}</span>
          </div>
        </div>

        <Link to={`/c/${slug}/t/${tableId}/menu`} className="block mt-6">
          <Button variant="secondary" size="lg" className="w-full !rounded-full">
            Back to Menu
          </Button>
        </Link>
      </div>
    </Page>
  )
}
