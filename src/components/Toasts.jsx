import React, { createContext, useCallback, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, BellRing } from 'lucide-react'

const ToastContext = createContext(null)

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((toast) => {
    const id = nextId++
    setToasts((prev) => [...prev.slice(-2), { id, type: 'info', ...toast }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const value = { push }

  const icons = {
    success: <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />,
    error: <AlertCircle size={20} className="text-red-500 shrink-0" />,
    order: <BellRing size={20} className="text-brand-500 shrink-0" />
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              className="pointer-events-auto flex items-center gap-3 bg-stone-900 text-white pl-3 pr-4 py-3 rounded-2xl shadow-pop max-w-xs"
            >
              {icons[t.type] || icons.order}
              <div>
                <p className="text-sm font-bold leading-tight">{t.title}</p>
                {t.message && <p className="text-xs text-stone-300 mt-0.5">{t.message}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToasts() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts must be used within ToastProvider')
  return ctx
}
