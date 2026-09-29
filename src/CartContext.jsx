import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

const cartKey = (restaurantId) => `orderkraft_cart_${restaurantId || 'global'}`

function readCart(restaurantId) {
  try {
    const raw = localStorage.getItem(cartKey(restaurantId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [restaurantId, setRestaurantId] = useState(null)
  const [items, setItems] = useState([])

  // Load the cart whenever the restaurant context changes
  useEffect(() => {
    setItems(readCart(restaurantId))
  }, [restaurantId])

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(cartKey(restaurantId), JSON.stringify(items))
    } catch {
      /* storage full / unavailable */
    }
  }, [items, restaurantId])

  const addItem = (dish, qty = 1) => {
    const id = dish._id || dish.id
    setItems((prev) => {
      const found = prev.find((i) => i.id === id)
      if (found) {
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
      }
      return [
        ...prev,
        {
          id,
          name: dish.name,
          price: Number(dish.price) || 0,
          image: dish.image || dish.imageUrl || '',
          qty
        }
      ]
    })
  }

  const setQty = (id, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i))
    )
  }

  const removeItem = (id) => setQty(id, 0)

  const clearCart = () => setItems([])

  const qtyOf = (id) => items.find((i) => i.id === id)?.qty || 0

  const { count, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, i) => ({
        count: acc.count + i.qty,
        subtotal: acc.subtotal + i.qty * i.price
      }),
      { count: 0, subtotal: 0 }
    )
  }, [items])

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      addItem,
      setQty,
      removeItem,
      clearCart,
      qtyOf,
      setRestaurantId
    }),
    [items, count, subtotal, restaurantId]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
