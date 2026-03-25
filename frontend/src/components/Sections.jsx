import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// ── FEATURES ─────────────────────────────────────
export function FeaturesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const features = [
    { icon: '🎯', title: 'Real-Time Detection', desc: 'Sub-200ms inference on live CCTV streams. Frame-level accuracy.' },
    { icon: '📊', title: 'Risk Scoring', desc: 'Dynamic risk score per worker. Pattern-based, not binary.' },
    { icon: '🗺', title: 'Zone-Based Alerts', desc: 'Different PPE rules enforced per physical zone automatically.' },
    { icon: '⏱', title: 'Temporal Tracking', desc: 'Behavioural patterns over time — not just single-frame analysis.' },
    { icon: '💡', title: 'Lighting Adaptive', desc: 'Reliable inference in dark, dim, or overexposed environments.' },
    { icon: '🔒', title: 'Privacy First', desc: 'Zero facial recognition. Workers are anonymous. Always.' },
    { icon: '⚡', title: 'Edge Deployable', desc: 'Runs on-device. No cloud dependency for core detection.' },
    { icon: '🔔', title: 'Multi-Channel Alerts', desc: 'Dashboard, SMS, alarm, and webhook integrations built-in.' },
  ]

  return (
    <section className="section features-section" ref={ref} id="analytics">
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 0 }}
        >
          <div>
            <div className="section-label">Capabilities</div>
            <h2 className="section-title-xl">Built for<br />the <em>real world</em></h2>
          </div>
          <p className="section-body" style={{ maxWidth: 340, textAlign: 'right' }}>
            Seven layers of industrial intelligence. Engineered for reliability, not demos.
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-cell"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.07 + 0.2, duration: 0.5 }}
            >
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
              <div className="feature-accent" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────
export function CTASection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="cta-section" ref={ref}>
      {/* Ambient light */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 800, height: 400,
        background: 'radial-gradient(ellipse, rgba(255,107,26,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <div className="cta-title">
          SAFER SITES<br />START WITH<br /><em>Smarter Systems</em>
        </div>
        <div className="cta-sub">Deploy in hours. Monitor forever.</div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 48 }}
        >
          <button className="btn-primary" onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </button>
          <button className="btn-ghost">
            Request a Demo
          </button>
        </motion.div>
      </motion.div>
    </section>
  )
}

// ── FOOTER ───────────────────────────────────────
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ marginRight: 8 }}>
          <path d="M10 1L18 5.5V14.5L10 19L2 14.5V5.5L10 1Z" stroke="#FF6B1A" strokeWidth="1.5" fill="none"/>
          <circle cx="10" cy="10" r="3" fill="#FF6B1A"/>
        </svg>
        SAFEGUARD<span style={{ color: '#FF6B1A' }}>AI</span>
      </div>
      <div className="footer-copy">© 2025 SafeGuardAI · Real-Time PPE Compliance Monitoring System</div>
      <div style={{ display: 'flex', gap: 24 }}>
        {['Privacy', 'Terms', 'Contact'].map(l => (
          <span key={l} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'rgba(240,237,232,0.25)',
            cursor: 'pointer',
          }}>{l}</span>
        ))}
      </div>
    </footer>
  )
}