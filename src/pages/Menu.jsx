import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingBag, X, Armchair, ChevronLeft, Plus, Star, Flame } from 'lucide-react'
import api from '../api.js'
import { getSocket, joinTable } from '../socket.js'
import { useCart } from '../CartContext.jsx'
import { Page, Button, Skeleton, EmptyState, DishImage, QtyStepper, inr } from '../components/ui.jsx'
import useTableLabel from '../hooks/useTableLabel.js'

const normItem = (m) => ({
  id: m._id || m.id,
  name: m.name,
  description: m.description || '',
  price: Number(m.price) || 0,
  category: m.category || 'Other',
  image: m.image || m.imageUrl || '',
  available: m.available ?? m.inStock ?? m.isAvailable ?? true
})

export default function Menu() {
  const { slug, tableId } = useParams()
  const navigate = useNavigate()
  const cart = useCart()

  const [restaurant, setRestaurant] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const tableLabel = useTableLabel(restaurant?._id || restaurant?.id, tableId)

  const fetchMenu = useCallback(async (restaurantId) => {
    const res = await api.get('/api/menu', { params: { restaurant: restaurantId } })
    const list = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.menu || []
    return list.map(normItem)
  }, [])

  const fetchMenuRef = useRef(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rRes = await api.get(`/api/restaurant/${slug}`)
        const r = rRes.data?.restaurant || rRes.data
        if (!alive) return
        setRestaurant(r)
        const rid = r._id || r.id
        cart.setRestaurantId(rid)
        const menuItems = await fetchMenu(rid)
        if (!alive) return
        setItems(menuItems)
      } catch (err) {
        if (alive) setError(err.friendlyMessage || 'Could not load the menu.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Keep a ref to the latest refetch so the socket handler never goes stale
  useEffect(() => {
    fetchMenuRef.current = async () => {
      const rid = restaurant?._id || restaurant?.id
      if (!rid) return
      try {
        setItems(await fetchMenu(rid))
      } catch {
        /* keep old menu on transient failure */
      }
    }
  }, [restaurant, fetchMenu])

  // Real-time: rejoin room + refetch on menu updates
  useEffect(() => {
    const rid = restaurant?._id || restaurant?.id
    if (!rid) return
    const socket = getSocket()
    joinTable(tableId)
    const onMenuUpdated = (payload) => {
      if (!payload?.restaurantId || String(payload.restaurantId) === String(rid)) {
        fetchMenuRef.current?.()
      }
    }
    socket.on('menu_updated', onMenuUpdated)
    return () => {
      socket.off('menu_updated', onMenuUpdated)
    }
  }, [restaurant, tableId])

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category))
    return ['All', ...Array.from(set)]
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(
      (i) =>
        (category === 'All' || i.category === category) &&
        (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    )
  }, [items, category, query])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const i of filtered) {
      if (!map.has(i.category)) map.set(i.category, [])
      map.get(i.category).push(i)
    }
    return Array.from(map.entries())
  }, [filtered])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <Skeleton className="h-40 w-full !rounded-none" />
        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
          {[0, 1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-28 !rounded-3xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6">
        <EmptyState
          title="Menu unavailable"
          subtitle={error}
          action={
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <Page className="min-h-screen bg-cream-50 pb-36 font-display">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur border-b border-orange-100/70">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center gap-2">
            <Link
              to={`/c/${slug}/t/${tableId}`}
              className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-stone-600 active:scale-90 transition-transform"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-extrabold text-xl truncate text-stone-900">
                {restaurant?.name || 'Menu'}
              </h1>
              <p className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                <Armchair size={12} /> {tableLabel || 'Table …'}
              </p>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative p-2.5 rounded-full bg-brand-600 text-white shadow-glow active:scale-90 transition-transform"
              aria-label="Open cart"
            >
              <ShoppingBag size={20} />
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-cream-50">
                  {cart.count}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-orange-100 shadow-warm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm placeholder:text-stone-400"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 -mx-4 px-4 pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 ${
                  category === c
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'bg-white text-stone-600 border border-orange-100 shadow-warm hover:border-brand-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-8">
        {grouped.length === 0 && (
          <EmptyState
            title="No dishes found"
            subtitle="Try a different search or category."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('')
                  setCategory('All')
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
        {grouped.map(([cat, list]) => (
          <section key={cat}>
            <h2 className="font-extrabold text-xl mb-3 flex items-center gap-2 text-stone-900">
              <Flame size={18} className="text-brand-500" />
              {cat}
              <span className="text-xs font-bold text-brand-700 bg-brand-100 rounded-full px-2.5 py-0.5">
                {list.length}
              </span>
            </h2>
            <div className="space-y-3">
              {list.map((item) => (
                <MenuItemCard key={item.id} item={item} cart={cart} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Floating cart pill */}
      <AnimatePresence>
        {cart.count > 0 && !drawerOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4 safe-bottom pointer-events-none"
          >
            <button
              onClick={() => setDrawerOpen(true)}
              className="pointer-events-auto max-w-2xl mx-auto w-full bg-stone-900 text-white rounded-full shadow-pop px-6 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <span className="flex items-center gap-2.5 font-bold">
                <span className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                  <ShoppingBag size={16} />
                </span>
                {cart.count} item{cart.count > 1 ? 's' : ''}
              </span>
              <span className="font-extrabold text-lg">{inr(cart.subtotal)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-cream-50 rounded-t-[2rem] shadow-pop max-h-[82vh] flex flex-col"
            >
              <div className="w-12 h-1.5 bg-orange-200 rounded-full mx-auto mt-3" />
              <div className="flex items-center justify-between px-5 pt-3 pb-3">
                <h3 className="font-extrabold text-xl text-stone-900">Your order</h3>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-full bg-white shadow-warm text-stone-500 active:scale-90 transition-transform"
                  aria-label="Close cart"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto px-4 py-2 flex-1">
                {cart.items.length === 0 ? (
                  <p className="text-center text-stone-500 text-sm py-8">
                    Your cart is empty. Add something delicious!
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {cart.items.map((i) => (
                      <div
                        key={i.id}
                        className="bg-white rounded-2xl shadow-warm border border-orange-100/60 p-3 flex items-center gap-3"
                      >
                        <DishImage src={i.image} alt={i.name} className="w-14 h-14 rounded-xl shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-stone-900">{i.name}</p>
                          <p className="text-xs text-stone-500">{inr(i.price)} each</p>
                        </div>
                        <QtyStepper
                          small
                          qty={i.qty}
                          onInc={() => cart.setQty(i.id, i.qty + 1)}
                          onDec={() => cart.setQty(i.id, i.qty - 1)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.items.length > 0 && (
                <div className="p-5 pt-3 safe-bottom">
                  <div className="flex justify-between items-center mb-4 bg-white rounded-2xl shadow-warm border border-orange-100/60 px-4 py-3">
                    <span className="text-stone-500 text-sm font-semibold">Subtotal</span>
                    <span className="font-extrabold text-xl text-brand-600">{inr(cart.subtotal)}</span>
                  </div>
                  <Button
                    size="lg"
                    className="w-full !rounded-full"
                    onClick={() => navigate(`/c/${slug}/t/${tableId}/cart`)}
                  >
                    Review & Checkout
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Page>
  )
}

function MenuItemCard({ item, cart }) {
  const qty = cart.qtyOf(item.id)
  const dish = {
    _id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    imageUrl: item.image
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-3xl shadow-warm border border-orange-100/60 p-3 flex gap-3 ${
        item.available ? '' : 'opacity-60'
      }`}
    >
      <DishImage src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[15px] leading-snug text-stone-900">{item.name}</h3>
          {!item.available && (
            <span className="shrink-0 text-[11px] font-bold uppercase text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
              Sold out
            </span>
          )}
        </div>
        {item.description ? (
          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        ) : (
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" /> Chef's special
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="font-extrabold text-lg text-brand-600">{inr(item.price)}</span>
          {item.available &&
            (qty === 0 ? (
              <button
                onClick={() => cart.addItem(dish)}
                className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-glow flex items-center justify-center active:scale-90 transition-transform"
                aria-label={`Add ${item.name}`}
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            ) : (
              <QtyStepper
                small
                qty={qty}
                onInc={() => cart.setQty(item.id, qty + 1)}
                onDec={() => cart.setQty(item.id, qty - 1)}
              />
            ))}
        </div>
      </div>
    </motion.div>
  )
}
