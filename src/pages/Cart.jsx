import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ShoppingBag, Loader2, ShieldCheck, Receipt } from 'lucide-react'
import api from '../api.js'
import { useCart } from '../CartContext.jsx'
import { Page, Button, EmptyState, DishImage, QtyStepper, inr } from '../components/ui.jsx'

const GST_RATE = 0.05

export default function Cart() {
  const { slug, tableId } = useParams()
  const navigate = useNavigate()
  const cart = useCart()

  const [restaurantId, setRestaurantId] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Resolve the restaurant id from the slug so the order payload is complete
    let alive = true
    api
      .get(`/api/restaurant/${slug}`)
      .then((res) => {
        const r = res.data?.restaurant || res.data
        if (alive && r) {
          const rid = r._id || r.id
          setRestaurantId(rid)
          cart.setRestaurantId(rid)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const subtotal = cart.subtotal
  const tax = Math.round(subtotal * GST_RATE)
  const total = subtotal + tax

  const goToPayment = () => navigate(`/c/${slug}/t/${tableId}/pay`)

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6 font-display">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          subtitle="Head back to the menu and add something delicious."
          action={
            <Link to={`/c/${slug}/t/${tableId}/menu`}>
              <Button className="!rounded-full">Browse Menu</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <Page className="min-h-screen bg-cream-50 pb-44 font-display">
      <div className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur border-b border-orange-100/70">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link
            to={`/c/${slug}/t/${tableId}/menu`}
            className="p-2 -ml-2 rounded-full hover:bg-orange-100 text-stone-600 active:scale-90 transition-transform"
            aria-label="Back to menu"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="font-extrabold text-xl text-stone-900">Review your order</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {cart.items.map((i) => (
          <div
            key={i.id}
            className="bg-white rounded-3xl shadow-warm border border-orange-100/60 p-3 flex items-center gap-3"
          >
            <DishImage src={i.image} alt={i.name} width={64} height={64} className="w-16 h-16 rounded-2xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate text-stone-900">{i.name}</p>
              <p className="text-xs text-stone-500">{inr(i.price)} each</p>
              <p className="font-extrabold text-sm mt-1 text-brand-600">{inr(i.price * i.qty)}</p>
            </div>
            <QtyStepper
              small
              qty={i.qty}
              onInc={() => cart.setQty(i.id, i.qty + 1)}
              onDec={() => cart.setQty(i.id, i.qty - 1)}
            />
          </div>
        ))}

        {/* Bill */}
        <div className="bg-white rounded-[1.75rem] shadow-warm border border-orange-100/60 p-6 mt-5">
          <h2 className="font-extrabold mb-4 flex items-center gap-2 text-stone-900">
            <Receipt size={17} className="text-brand-500" /> Bill details
          </h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500 font-medium">Subtotal</span>
              <span className="font-bold text-stone-800">{inr(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500 font-medium">GST (5%)</span>
              <span className="font-bold text-stone-800">{inr(tax)}</span>
            </div>
            <div className="border-t-2 border-dashed border-orange-200 pt-3 flex justify-between items-center">
              <span className="font-extrabold text-stone-900">To pay</span>
              <span className="font-extrabold text-2xl text-brand-600">{inr(total)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 font-semibold">
            {error}
          </div>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 safe-bottom bg-gradient-to-t from-cream-50 via-cream-50 to-transparent">
        <div className="max-w-2xl mx-auto">
          <Button size="lg" className="w-full !rounded-full !py-4" onClick={goToPayment}>
            Proceed to Payment · {inr(total)}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500 mt-2.5 font-medium">
            <ShieldCheck size={13} className="text-brand-500" /> Sent straight to the kitchen in real time
          </p>
        </div>
      </div>
    </Page>
  )
}
