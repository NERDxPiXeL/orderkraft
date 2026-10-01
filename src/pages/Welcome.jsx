import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Armchair, ArrowRight, MapPin, AlertTriangle, Zap, BellRing, UtensilsCrossed } from 'lucide-react'
import api from '../api.js'
import { Page, Button, Skeleton, EmptyState } from '../components/ui.jsx'
import useTableLabel from '../hooks/useTableLabel.js'

export default function Welcome() {
  const { slug, tableId } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const tableLabel = useTableLabel(restaurant?._id || restaurant?.id, tableId)

  useEffect(() => {
    // Remember this table so the cart / tracking pages know where we are
    try {
      localStorage.setItem('orderkraft_table', JSON.stringify({ slug, tableId }))
    } catch {
      /* ignore */
    }
    let alive = true
    api
      .get(`/api/restaurant/${slug}`)
      .then((res) => {
        if (!alive) return
        setRestaurant(res.data?.restaurant || res.data)
      })
      .catch((err) => {
        if (!alive) return
        setError(err.friendlyMessage || 'Could not load this restaurant.')
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug, tableId])

  const menuPath = `/c/${slug}/t/${tableId}/menu`
  const cover = restaurant?.coverImage || restaurant?.cover || ''

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <Skeleton className="h-64 w-full !rounded-none" />
        <div className="max-w-md mx-auto px-5 -mt-10 relative">
          <Skeleton className="h-10 w-3/4 mb-3 !rounded-2xl" />
          <Skeleton className="h-5 w-1/2 mb-6 !rounded-2xl" />
          <Skeleton className="h-14 w-full !rounded-full" />
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6">
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't find this restaurant"
          subtitle={error || 'The QR code may be outdated. Please ask the staff for help.'}
          action={
            <Link to="/">
              <Button variant="secondary">Back to OrderKraft</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <Page className="min-h-screen bg-cream-50 pb-10 font-display">
      {/* Cover */}
      <div className="relative h-72 sm:h-80 overflow-hidden rounded-b-[2.5rem] shadow-warm">
        {cover ? (
          <img
            src={cover}
            alt={restaurant.name}
            width={800}
            height={320}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 bg-white/95 rounded-full px-4 py-2 text-sm font-bold text-stone-900 shadow-pop mb-3"
            >
              <Armchair size={16} className="text-brand-600" />
              {tableLabel || 'Table …'}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-4xl font-extrabold text-white tracking-tight"
            >
              {restaurant.name}
            </motion.h1>
            {(restaurant.tagline || restaurant.address) && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="text-white/85 mt-1.5 flex items-center gap-1.5 text-sm font-medium"
              >
                <MapPin size={14} />
                {restaurant.tagline || restaurant.address}
              </motion.p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-md mx-auto px-5 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2rem] shadow-warm border border-orange-100/60 p-7 text-center"
        >
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Scan. Order. Done.
          </h2>
          <p className="text-sm text-stone-500 mt-2 leading-relaxed">
            Browse the live menu, order from your phone, and we'll bring it
            straight to {tableLabel || 'your table'}. No waiting for the waiter.
          </p>
          <Link to={menuPath} className="block mt-6">
            <Button size="lg" className="w-full !rounded-full !py-4 text-base font-bold">
              View Menu <ArrowRight size={18} />
            </Button>
          </Link>
        </motion.div>

        {/* Perks row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mt-5"
        >
          {[
            { icon: Zap, label: 'Super fast' },
            { icon: BellRing, label: 'Live kitchen' },
            { icon: UtensilsCrossed, label: 'No waiting' }
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="bg-white rounded-2xl shadow-warm border border-orange-100/60 py-4 flex flex-col items-center gap-1.5"
            >
              <span className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                <Icon size={17} />
              </span>
              <span className="text-[11px] font-bold text-stone-600">{label}</span>
            </div>
          ))}
        </motion.div>

        <p className="text-center text-xs text-stone-500 mt-8">
          Powered by <span className="font-bold text-brand-700">OrderKraft</span> · contactless ordering
        </p>
      </div>
    </Page>
  )
}
