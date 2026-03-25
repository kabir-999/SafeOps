import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { fetchDetections } from '../lib/mockData'
import DashboardSidebar from './Sidebar'
import DashboardHeader from './Header'
import { ZoneMapTab } from './LiveAndZoneTabs'
import { ViolationsTab, AnalyticsTab } from './WorkerTabs'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [detections, setDetections] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auth guard
  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true })
  }, [user, loading, navigate])

  // Fetch data
  const refresh = useCallback(async () => {
    const data = await fetchDetections()
    setDetections(data)
    setLastRefresh(new Date())
  }, [])

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(refresh, 5000) // refresh every 5s
    return () => clearInterval(interval)
  }, [autoRefresh, refresh])

  if (loading || !user) return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.1)',
        borderTopColor: '#FF6B1A',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const tabContent = () => {
    switch (activeTab) {
      case 'violations':return <ViolationsTab detections={detections} />
      case 'analytics': return <AnalyticsTab />
      case 'zones':     return <ZoneMapTab detections={detections} />
      default:          return <AnalyticsTab detections={detections} />
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#050505',
      fontFamily: "'Barlow Condensed', sans-serif",
      color: '#F0EDE8',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Noise overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        opacity: 0.018,
      }} />

      {/* Sidebar */}
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <DashboardHeader activeTab={activeTab} detections={detections} />

        {/* Tab content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#FF6B1A #111',
        }}>
          {/* Refresh bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 14,
            marginBottom: 20,
          }}>
            {lastRefresh && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'rgba(240,237,232,0.2)',
                letterSpacing: '0.1em',
              }}>
                Last updated: {lastRefresh.toLocaleTimeString('en-US', { hour12: false })}
              </span>
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                background: autoRefresh ? 'rgba(0,196,140,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${autoRefresh ? 'rgba(0,196,140,0.25)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4,
                color: autoRefresh ? '#00C48C' : 'rgba(240,237,232,0.3)',
                cursor: 'pointer',
              }}
            >
              {autoRefresh ? '● Auto' : '○ Manual'}
            </button>
            <button
              onClick={refresh}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '4px 12px',
                background: 'rgba(255,107,26,0.1)',
                border: '1px solid rgba(255,107,26,0.25)',
                borderRadius: 4,
                color: '#FF6B1A',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,26,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,107,26,0.1)'}
            >
              ↺ Refresh
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {tabContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;500&family=Oswald:wght@200;300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #FF6B1A; border-radius: 2px; }
        body { cursor: default; }
      `}</style>
    </div>
  )
}