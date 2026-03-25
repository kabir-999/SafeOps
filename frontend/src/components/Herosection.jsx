import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import HeroCanvas from './Herocanvas'

const ALERT_ROUTE = '/three.js'

export default function HeroSection() {
  const sectionRef = useRef(null)
  const scrollYRef = useRef(0)
  const navigate = useNavigate()

  const { scrollY } = useScroll()

  useEffect(() => {
    return scrollY.onChange(v => { scrollYRef.current = v })
  }, [scrollY])

  return (
    <section className="hero-section" ref={sectionRef}>
      {/* Full-screen canvas */}
      <div className="hero-canvas-wrap">
        <HeroCanvas scrollY={scrollYRef} />
      </div>

      {/* Center content */}
      <div className="hero-content">
        <motion.div
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          AI-Powered Safety Intelligence
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="hero-title-line1">REAL-TIME</span>
          <span className="hero-title-line2">PPE Compliance</span>
          <span className="hero-title-line3">Zero Blind Spots</span>
        </motion.div>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          Industrial safety monitoring powered by computer vision.
          Detect violations the instant they happen — not after.
        </motion.p>

        <motion.div
          className="hero-cta-group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
        >
          <button className="btn-primary" onClick={() => window.location.href = '/dashboard'}>
            Enter Dashboard
          </button>
          <button className="btn-ghost" onClick={() => navigate(ALERT_ROUTE)}>
            Alert
          </button>
          <button className="btn-ghost">
            Watch Demo ▶
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-hint">
        <div className="scroll-wheel">
          <div className="scroll-wheel-dot" />
        </div>
        <span>Scroll to explore</span>
      </div>

      {/* Stats strip at very bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          gap: 0,
          zIndex: 10,
        }}
      >
        {[
          ['99.2%', 'Detection Accuracy'],
          ['<200ms', 'Alert Latency'],
          ['24/7', 'Continuous Monitoring'],
          ['0', 'Facial Recognition'],
        ].map(([val, label], i) => (
          <div key={label} style={{
            padding: '20px 48px',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 28,
              letterSpacing: '0.04em',
              color: '#F0EDE8',
              lineHeight: 1,
            }}>{val}</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(240,237,232,0.3)',
              marginTop: 6,
            }}>{label}</div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
