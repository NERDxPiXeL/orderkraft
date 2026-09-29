import React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams
} from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import { CartProvider } from './CartContext.jsx'
import { AuthProvider, useAuth, DEMO_SLUG } from './AuthContext.jsx'
import { EmptyState, Spinner, Page, Button } from './components/ui.jsx'
import Landing from './pages/Landing.jsx'
import Welcome from './pages/Welcome.jsx'
import Menu from './pages/Menu.jsx'
import Cart from './pages/Cart.jsx'
import Payment from './pages/Payment.jsx'
import Verifying from './pages/Verifying.jsx'
import Track from './pages/Track.jsx'
import Admin from './pages/Admin.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'

/**
 * Guards /admin/:slug. The demo restaurant (spice-route) renders without a
 * login; any other slug requires a session whose restaurants include it.
 */
function RequireAuth() {
  const { slug } = useParams()
  const { session, user, restaurants, loading, logout } = useAuth()

  if (slug === DEMO_SLUG) return <Admin />

  if (loading) {
    return (
      <Page className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Spinner />
      </Page>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  const owns = (restaurants || []).some((r) => r.slug === slug)
  if (!owns) {
    return (
      <Page className="min-h-screen bg-stone-100 flex items-center justify-center px-6">
        <EmptyState
          icon={ShieldAlert}
          title="Not authorized for this restaurant"
          subtitle={
            user?.email
              ? `${user.email} doesn't have access to this dashboard.`
              : "This account doesn't have access to this dashboard."
          }
          action={
            <Button
              variant="secondary"
              onClick={async () => {
                await logout()
              }}
            >
              Log out
            </Button>
          }
        />
      </Page>
    )
  }

  return <Admin />
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/c/:slug/t/:tableId" element={<Welcome />} />
        <Route path="/c/:slug/t/:tableId/menu" element={<Menu />} />
        <Route path="/c/:slug/t/:tableId/cart" element={<Cart />} />
        <Route path="/c/:slug/t/:tableId/pay" element={<Payment />} />
        <Route path="/c/:slug/t/:tableId/verifying/:orderId" element={<Verifying />} />
        <Route path="/c/:slug/t/:tableId/track/:orderId" element={<Track />} />
        <Route path="/admin/:slug" element={<RequireAuth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AnimatedRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
