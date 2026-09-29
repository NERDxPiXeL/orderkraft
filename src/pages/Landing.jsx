import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  QrCode,
  Smartphone,
  ChefHat,
  LayoutDashboard,
  ArrowRight,
  Zap,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  BellRing,
  CheckCircle2
} from 'lucide-react'
import { Page, Button } from '../components/ui.jsx'

const steps = [
  {
    icon: QrCode,
    title: 'Instant QR Scan',
    text: 'Customers simply point their camera at the table QR code. Instant menu loading without downloading any mobile app.',
    tag: 'Step 1',
    image: 'https://images.unsplash.com/photo-1595079672139-cee25608b474?auto=format&fit=crop&w=800&q=80'
  },
  {
    icon: Smartphone,
    title: 'Seamless Digital Order',
    text: 'Guests browse rich visual menus, customize dishes, build carts, and place orders directly from their smartphone.',
    tag: 'Step 2',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    icon: ChefHat,
    title: 'Instant Kitchen KDS',
    text: 'Orders flash on the kitchen display in real-time with sound notifications. Cook progress syncs live with table status.',
    tag: 'Step 3',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
  }
]

const stats = [
  { value: '0 sec', label: 'App download needed' },
  { value: '35%', label: 'Average order value increase' },
  { value: '<100ms', label: 'Real-time kitchen sync speed' },
  { value: '100%', label: 'Contactless & hygienic' }
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

export default function Landing() {
  return (
    <Page className="min-h-screen bg-cream-50 text-stone-900 font-sans selection:bg-orange-200 selection:text-orange-900 overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-amber-300/30 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-orange-300/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation Bar */}
        <header className="border-b border-orange-100/80 bg-cream-50/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src="/orderkraft-logo.webp" alt="OrderKraft" className="h-11 w-auto" />
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-bold text-stone-600 hover:text-stone-900 px-4 py-2 rounded-xl hover:bg-orange-100/70 transition-all"
              >
                Log in
              </Link>
              <Link to="/signup">
                <Button className="!rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 border-0 transition-all">
                  Sign up free
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Text */}
            <motion.div
              className="lg:col-span-7 text-center lg:text-left"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={itemVariants} className="inline-block">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-600 text-xs font-extrabold tracking-wide uppercase">
                  <Sparkles size={14} className="animate-pulse" />
                  Next-Gen Contactless Dining
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight text-stone-900"
              >
                Supercharge your restaurant with{' '}
                <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 bg-clip-text text-transparent">
                  instant QR ordering.
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mt-6 text-lg sm:text-xl text-stone-500 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              >
                Let guests scan table QR codes, browse rich menus, and order instantly. Zero app downloads, zero waiting time, and real-time kitchen syncing.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link to="/c/spice-route/t/demo-table">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto !rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold h-14 px-8 shadow-xl shadow-orange-500/25 border-0 text-base flex items-center justify-center gap-2 active:scale-98 transition-transform"
                  >
                    <span>Try Customer Demo</span>
                    <ArrowRight size={18} />
                  </Button>
                </Link>

                <Link to="/admin/spice-route">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto !rounded-2xl bg-white hover:bg-orange-50 text-stone-700 border border-orange-200 font-bold h-14 px-8 text-base flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-warm"
                  >
                    <LayoutDashboard size={18} className="text-orange-500" />
                    <span>View Admin Demo</span>
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mt-8 flex items-center justify-center lg:justify-start gap-3 text-xs font-semibold text-stone-500"
              >
                <div className="flex items-center gap-1.5 bg-white border border-orange-100 px-3 py-1.5 rounded-lg shadow-sm">
                  <Zap size={14} className="text-amber-500" />
                  <span>Real-Time WebSockets</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-orange-100 px-3 py-1.5 rounded-lg shadow-sm">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>No Hardware Required</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Visual Hero Showcase Card with Real Food Images */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative mx-auto max-w-sm bg-white p-5 rounded-[2.5rem] border border-orange-100 shadow-2xl shadow-orange-500/10">
                {/* Header Mock */}
                <div className="flex items-center justify-between pb-4 border-b border-orange-100/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                      T4
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-800">Spice Route Cafe</p>
                      <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Table Connected
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full text-stone-600">
                    Table #04
                  </span>
                </div>

                {/* Simulated Dishes Card with Real Images */}
                <div className="mt-4 space-y-3">
                  <div className="p-2.5 rounded-2xl bg-cream-50 border border-orange-100/70 flex gap-3 items-center">
                    <img
                      src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80"
                      alt="Artisanal Pizza"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 ring-1 ring-orange-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-800 truncate">Artisanal Truffle Pizza</p>
                      <p className="text-[11px] text-orange-600 font-bold">$18.50</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-black text-xs">
                      +1
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-cream-50 border border-orange-100/70 flex gap-3 items-center">
                    <img
                      src="https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=200&q=80"
                      alt="Passion Drink"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 ring-1 ring-orange-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-800 truncate">Iced Mango Passion</p>
                      <p className="text-[11px] text-orange-600 font-bold">$6.00</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-black text-xs">
                      +2
                    </span>
                  </div>
                </div>

                {/* Floating Kitchen Alert Overlay */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 3, delay: 1 }}
                  className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <BellRing size={18} className="animate-bounce" />
                    <div>
                      <p className="text-xs font-black">Kitchen Order Received</p>
                      <p className="text-[10px] text-white/80">Prep status: Cooking now</p>
                    </div>
                  </div>
                  <CheckCircle2 size={18} className="text-white/90" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-orange-100 bg-white/70 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((st) => (
                <div key={st.label} className="text-center">
                  <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                    {st.value}
                  </p>
                  <p className="text-xs font-semibold text-stone-500 mt-1 uppercase tracking-wider">
                    {st.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section with Step Images */}
        <section className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-extrabold text-orange-600 uppercase tracking-widest">
              Simple 3-Step Process
            </h2>
            <p className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-stone-900">
              How OrderKraft Works
            </p>
            <p className="mt-4 text-stone-500 text-base">
              Designed to eliminate service bottlenecks and keep both your customers and kitchen staff happy.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative bg-white border border-orange-100 rounded-3xl overflow-hidden shadow-warm hover:shadow-xl hover:border-orange-200 transition-all group flex flex-col justify-between"
              >
                {/* Step Image */}
                <div className="h-48 w-full overflow-hidden relative">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
                  <span className="absolute top-4 left-4 text-xs font-black uppercase tracking-wider text-white bg-orange-500 px-3 py-1 rounded-full shadow-md">
                    {s.tag}
                  </span>
                </div>

                {/* Step Body */}
                <div className="p-6 pt-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon size={20} className="text-orange-500" />
                      <h3 className="text-xl font-extrabold text-stone-900">{s.title}</h3>
                    </div>
                    <p className="text-stone-500 text-sm leading-relaxed">{s.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Call To Action Banner with Image Background Overlay */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="relative rounded-[2.5rem] bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-8 sm:p-14 overflow-hidden shadow-2xl shadow-orange-500/25">
            {/* Background Restaurant Image Overlay */}
            <div className="absolute inset-0 mix-blend-overlay opacity-25">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
                alt="Restaurant ambiance"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Ready to transform your dining experience?
              </h2>
              <p className="mt-4 text-white/90 text-base sm:text-lg font-medium">
                Set up your restaurant menu, print custom QR codes, and start accepting live orders in minutes.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button size="lg" className="!rounded-2xl bg-white text-stone-900 hover:bg-orange-50 font-bold h-13 px-8 shadow-xl border-0">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/admin/spice-route">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="!rounded-2xl bg-black/20 hover:bg-black/30 text-white border-white/40 font-bold h-13 px-8 backdrop-blur-md"
                  >
                    Explore Demo Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-orange-100 bg-cream-50 py-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-3">
              <img src="/orderkraft-logo.webp" alt="OrderKraft" className="h-8 w-auto" />
              <p>© {new Date().getFullYear()} OrderKraft. All rights reserved.</p>
            </div>
            <div className="flex gap-6 font-semibold">
              <Link to="/c/spice-route/t/demo-table" className="hover:text-stone-800 transition-colors">
                Customer Demo
              </Link>
              <Link to="/admin/spice-route" className="hover:text-stone-800 transition-colors">
                Admin Demo
              </Link>
              <Link to="/login" className="hover:text-stone-800 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </Page>
  )
}
