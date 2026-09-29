import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    })
  }
  return socket
}

export function joinAdmin(restaurantId, token) {
  if (!restaurantId) return
  // Token is optional for the demo restaurant (backend bypasses auth there).
  getSocket().emit('join_admin', token ? { restaurantId, token } : { restaurantId })
}

export function joinTable(tableId) {
  if (!tableId) return
  getSocket().emit('join_table', { tableId })
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
