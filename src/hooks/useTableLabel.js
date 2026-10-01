import { useEffect, useState } from 'react'
import api from '../api.js'

// Turns a raw table id (uuid) into a human label like "Table 1".
// Falls back to a short id slice while loading / if the table isn't found.
export default function useTableLabel(restaurantId, tableId) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    if (!restaurantId || !tableId) return
    let alive = true
    api
      .get('/api/tables', { params: { restaurant: restaurantId } })
      .then((res) => {
        if (!alive) return
        const list = res.data?.tables || res.data || []
        const t = list.find((x) => String(x._id || x.id) === String(tableId))
        const n = t?.tableNumber ?? t?.number ?? t?.name
        if (n) {
          setLabel(`Table ${n}`)
        } else {
          // Handle slug-like tableIds (e.g., "demo-table" → "Demo Table")
          const slugLabel = String(tableId)
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          setLabel(slugLabel || `Table ${String(tableId).slice(-4).toUpperCase()}`)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [restaurantId, tableId])
  return label
}
