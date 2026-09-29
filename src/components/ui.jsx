import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UtensilsCrossed, Minus, Plus } from 'lucide-react'

export const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`

/* ---------- Button ---------- */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base'
  }
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-glow',
    secondary: 'bg-white hover:bg-cream-100 text-stone-900 border border-orange-100 shadow-warm',
    ghost: 'bg-transparent hover:bg-orange-50 text-stone-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-card',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-card'
  }
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------- Badge / status pill ---------- */
const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  Served: 'bg-violet-100 text-violet-800 border-violet-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200'
}

export function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || 'bg-stone-100 text-stone-700 border-stone-200'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${style}`}
    >
      {status}
    </span>
  )
}

export function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, wide }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            className={`relative bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-pop`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon: Icon = UtensilsCrossed, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-100 to-amber-100 flex items-center justify-center text-brand-500 mb-4 shadow-warm">
        <Icon size={32} />
      </div>
      <h3 className="font-display font-bold text-lg text-stone-800">{title}</h3>
      {subtitle && <p className="text-sm text-stone-500 mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ---------- Spinner ---------- */
export function Spinner({ className = '' }) {
  return (
    <div
      className={`w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin ${className}`}
    />
  )
}

/* ---------- Page wrapper with enter animation ---------- */
export function Page({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Dish image with graceful fallback ---------- */
export function DishImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(!src)
  if (failed || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-amber-100 via-orange-100 to-brand-200 flex items-center justify-center ${className}`}
      >
        <UtensilsCrossed className="text-brand-500/70" size={36} />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}

/* ---------- Quantity stepper ---------- */
export function QtyStepper({ qty, onInc, onDec, small }) {
  const btn = small ? 'w-8 h-8' : 'w-9 h-9'
  return (
    <div className="flex items-center gap-1 bg-cream-100 rounded-full shadow-warm border border-orange-100 p-1">
      <button
        onClick={onDec}
        className={`${btn} rounded-full bg-white hover:bg-orange-50 flex items-center justify-center text-stone-600 shadow-card active:scale-90 transition-transform`}
        aria-label="Decrease quantity"
      >
        <Minus size={small ? 15 : 17} />
      </button>
      <span className="font-display font-extrabold text-sm min-w-[1.5rem] text-center text-stone-900">
        {qty}
      </span>
      <button
        onClick={onInc}
        className={`${btn} rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center text-white shadow-glow active:scale-90 transition-transform`}
        aria-label="Increase quantity"
      >
        <Plus size={small ? 15 : 17} strokeWidth={2.5} />
      </button>
    </div>
  )
}
