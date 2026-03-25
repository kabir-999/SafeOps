import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { signInWithGoogle } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import CustomCursor from '../components/Customcursor'

// ── Animated background canvas ──────────────────────────────
function LoginCanvas() {
  const ref = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (ts) => {
      const t = ts / 1000
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#020202'
      ctx.fillRect(0, 0, W, H)

      // Rotating grid
      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.rotate(t * 0.04)
      ctx.strokeStyle = 'rgba(255,107,26,0.04)'
      ctx.lineWidth = 1
      const gs = 60
      for (let x = -W; x < W; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, -H); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = -H; y < H; y += gs) {
        ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W, y); ctx.stroke()
      }
      ctx.restore()

      // Light orbs
      const orbs = [
        { x: W * 0.2, y: H * 0.3, r: 250, color: '255,107,26', speed: 0.3 },
        { x: W * 0.8, y: H * 0.7, r: 200, color: '26,86,255', speed: 0.2 },
        { x: W * 0.6, y: H * 0.2, r: 180, color: '255,184,0', speed: 0.4 },
      ]
      orbs.forEach(o => {
        const ox = o.x + Math.sin(t * o.speed) * 60
        const oy = o.y + Math.cos(t * o.speed * 1.3) * 40
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r)
        g.addColorStop(0, `rgba(${o.color},0.06)`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(ox, oy, o.r, 0, Math.PI * 2); ctx.fill()
      })

      // Floating particles
      for (let i = 0; i < 30; i++) {
        const px = ((Math.sin(i * 2.4 + t * 0.05) * 0.5 + 0.5) * W)
        const py = ((Math.cos(i * 1.9 + t * 0.04) * 0.5 + 0.5) * H)
        const pa = 0.08 + 0.06 * Math.sin(t * 0.8 + i)
        ctx.fillStyle = i % 3 === 0 ? `rgba(255,107,26,${pa})` : `rgba(255,255,255,${pa * 0.4})`
        ctx.beginPath(); ctx.arc(px, py, 1.2, 0, Math.PI * 2); ctx.fill()
      }

      // Vignette
      const vig = ctx.createRadialGradient(W/2, H/2, W*0.2, W/2, H/2, W*0.8)
      vig.addColorStop(0, 'transparent')
      vig.addColorStop(1, 'rgba(0,0,0,0.7)')
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)

      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState(null)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  const handleGoogleLogin = async () => {
    setSigningIn(true)
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setSigningIn(false)
    }
    // On success, Supabase will redirect to /dashboard
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#020202',
      display: 'flex',
      overflow: 'hidden',
      fontFamily: "'Barlow Condensed', sans-serif",
      cursor: 'none',
    }}>
      <CustomCursor />
      {/* Background */}
      <LoginCanvas />

      {/* Left panel — branding */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
          zIndex: 1,
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
          <div style={{
            width: 40, height: 40,
            background: '#FF6B1A',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(255,107,26,0.4)',
          }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path d="M10 1L18 5.5V14.5L10 19L2 14.5V5.5L10 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="10" cy="10" r="3" fill="white"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.1em', color: '#F0EDE8' }}>
            SAFEGUARD<span style={{ color: '#FF6B1A' }}>AI</span>
          </span>
        </div>

        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#FF6B1A',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 30, height: 1, background: '#FF6B1A', opacity: 0.5, display: 'inline-block' }} />
            Supervisor Access Portal
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(52px, 5vw, 80px)',
            letterSpacing: '0.04em',
            lineHeight: 0.92,
            color: '#F0EDE8',
            marginBottom: 28,
          }}>
            REAL-TIME<br />
            <span style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              color: '#FF6B1A',
              fontSize: 'clamp(44px, 4.5vw, 72px)',
            }}>Safety</span><br />
            COMMAND
          </h1>

          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 16,
            fontWeight: 300,
            letterSpacing: '0.05em',
            color: 'rgba(240,237,232,0.45)',
            lineHeight: 1.7,
            maxWidth: 400,
          }}>
            Monitor PPE compliance across all active zones. Instant violation alerts. Full audit trail.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 0, marginTop: 60, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 40 }}>
          {[
            ['99.2%', 'Accuracy'],
            ['<200ms', 'Latency'],
            ['24/7', 'Uptime'],
          ].map(([v, l], i) => (
            <div key={l} style={{ paddingRight: 40, borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', marginRight: i < 2 ? 40 : 0 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: '0.02em', color: '#F0EDE8', lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.3)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right panel — login form */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '42%',
          maxWidth: 520,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 64px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#F0EDE8',
            marginBottom: 10,
          }}>
            Sign In
          </h2>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 15,
            fontWeight: 300,
            letterSpacing: '0.04em',
            color: 'rgba(240,237,232,0.4)',
          }}>
            Authorised supervisors only. Access is logged.
          </p>
        </div>

        {/* Google button */}
        <motion.button
          onClick={handleGoogleLogin}
          disabled={signingIn}
          whileHover={!signingIn ? { scale: 1.02, y: -2 } : {}}
          whileTap={!signingIn ? { scale: 0.98 } : {}}
          style={{
            width: '100%',
            padding: '18px 24px',
            background: signingIn ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            cursor: signingIn ? 'wait' : 'pointer',
            transition: 'all 0.2s',
            marginBottom: 16,
          }}
        >
          {/* Google icon */}
          {signingIn ? (
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.2)',
              borderTopColor: '#FF6B1A',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
          )}
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: '0.08em',
            color: '#F0EDE8',
          }}>
            {signingIn ? 'Authenticating...' : 'Continue with Google'}
          </span>
        </motion.button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,45,85,0.1)',
              border: '1px solid rgba(255,45,85,0.3)',
              borderRadius: 6,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#FF2D55',
              marginBottom: 16,
            }}
          >
            ⚠ {error}
          </motion.div>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(240,237,232,0.2)', textTransform: 'uppercase' }}>Secured by Supabase</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Security notice */}
        <div style={{
          padding: '16px 18px',
          background: 'rgba(26,86,255,0.06)',
          border: '1px solid rgba(26,86,255,0.15)',
          borderRadius: 6,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔒</span>
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(240,237,232,0.6)', marginBottom: 4 }}>SECURE ACCESS</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 300, letterSpacing: '0.03em', color: 'rgba(240,237,232,0.35)', lineHeight: 1.5 }}>
              All sessions are encrypted and access is logged. Privacy-first — no facial recognition data stored.
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 'auto',
          paddingTop: 48,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.15em',
          color: 'rgba(240,237,232,0.15)',
          textAlign: 'center',
        }}>
          SAFEGUARD AI · INDUSTRIAL SAFETY PLATFORM · v2.4
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;500&family=Oswald:wght@200;300;400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}