import { motion } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'

const TAB_LABELS = {
  violations: 'Violation Log',
  analytics: 'Analytics & Trends',
  zones: 'Zone Safety Map',
}

export default function DashboardHeader({ activeTab, detections }) {
  const { user } = useAuth()
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

  const violations = detections?.persons?.filter(p => p.violations.length > 0).length || 0
  const total = detections?.persons?.length || 0
  const compliance = total > 0 ? Math.round(((total - violations) / total) * 100) : 100

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        height: 60,
        background: 'rgba(8,8,8,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 24,
        flexShrink: 0,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Page title */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#F0EDE8',
        }}>
          {TAB_LABELS[activeTab]}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.15em',
          color: 'rgba(240,237,232,0.25)',
          marginTop: 1,
        }}>
          {dateStr}
        </div>
      </div>

      {/* Live compliance chip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: compliance >= 90 ? 'rgba(0,196,140,0.1)' : compliance >= 75 ? 'rgba(255,184,0,0.1)' : 'rgba(255,45,85,0.1)',
        border: `1px solid ${compliance >= 90 ? 'rgba(0,196,140,0.3)' : compliance >= 75 ? 'rgba(255,184,0,0.3)' : 'rgba(255,45,85,0.3)'}`,
        borderRadius: 6,
        padding: '6px 14px',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: compliance >= 90 ? '#00C48C' : compliance >= 75 ? '#FFB800' : '#FF2D55',
          animation: 'pulse 1.5s infinite',
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: compliance >= 90 ? '#00C48C' : compliance >= 75 ? '#FFB800' : '#FF2D55',
          letterSpacing: '0.1em',
        }}>
          {compliance}% COMPLIANT
        </span>
      </div>

      {/* Violation badge */}
      {violations > 0 && (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,45,85,0.12)',
            border: '1px solid rgba(255,45,85,0.35)',
            borderRadius: 6,
            padding: '6px 14px',
          }}
        >
          <span style={{ fontSize: 10 }}>⚠</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#FF2D55',
            letterSpacing: '0.1em',
          }}>
            {violations} ACTIVE VIOLATION{violations > 1 ? 'S' : ''}
          </span>
        </motion.div>
      )}

      {/* Live time */}
      <LiveClock />

      {/* User name */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'rgba(240,237,232,0.3)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        paddingLeft: 20,
      }}>
        {user?.user_metadata?.full_name?.split(' ')[0]?.toUpperCase() || user?.email?.split('@')[0]?.toUpperCase() || 'SUPERVISOR'}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </motion.header>
  )
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      letterSpacing: '0.1em',
      color: '#F0EDE8',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '4px 12px',
      borderRadius: 5,
    }}>
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </div>
  )
}

// useState import needed
import { useState, useEffect } from 'react'