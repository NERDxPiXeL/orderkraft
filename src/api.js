import axios from 'axios'
import { getAccessToken } from './supabaseClient.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000
})

// Attach the auth token (supabase session or localStorage fallback) when present.
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken()
      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      /* never block a request on token lookup */
    }
    return config
  },
  (err) => Promise.reject(err)
)

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Attach a friendlier message for the UI
    err.friendlyMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (err.code === 'ECONNABORTED' ? 'Request timed out. Is the server running?' : err.message)
    return Promise.reject(err)
  }
)

export default api
