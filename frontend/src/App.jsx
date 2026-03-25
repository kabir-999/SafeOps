import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import LoadingScreen from './components/Loadingscreen'
import CustomCursor from './components/Customcursor'
import Navbar from './components/Navbar'
import HeroSection from './components/Herosection'
import ProblemSection from './components/Problemsection'
import SolutionSection from './components/Solutionsection'
import { FeaturesSection, CTASection, Footer } from './components/Sections'
import LoginPage from './pages/LoginPage'
import DashboardPage from './dashboard/DashboardPage'
import ProtectedRoute from './ProtectedRoute'
import { AnimatePresence, motion } from 'framer-motion'

function AlertPage() {
  const navigate = useNavigate()
  const iframeRef = useRef(null)

  useEffect(() => {
    const focusIframe = () => {
      const iframe = iframeRef.current
      if (!iframe) return

      iframe.focus()
      iframe.contentWindow?.focus?.()
    }

    const frameId = window.requestAnimationFrame(focusIframe)
    const timeoutId = window.setTimeout(focusIframe, 250)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 6,
          background: 'rgba(0,0,0,0.72)',
          color: '#F0EDE8',
          padding: '12px 18px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Back
      </button>

      <iframe
        ref={iframeRef}
        title="Three.js Warehouse Alert"
        src="/warehouse.html"
        tabIndex={-1}
        onLoad={() => {
          iframeRef.current?.focus()
          iframeRef.current?.contentWindow?.focus?.()
        }}
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </div>
  )
}

function HomePage() {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      <CustomCursor />
      <AnimatePresence>
        {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      </AnimatePresence>
      {loaded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <Navbar />
          <main>
            <HeroSection />
            <ProblemSection />
            <SolutionSection />
            <FeaturesSection />
            <CTASection />
          </main>
          <Footer />
        </motion.div>
      )}
    </>
  )
}
 
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/three.js" element={<AlertPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
