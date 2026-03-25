import { useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'

function ProblemCanvas() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
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

      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, W, H)

      // Scanlines
      ctx.fillStyle = 'rgba(255,255,255,0.012)'
      for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1)
      }

      // A single worker, NO bounding box, no PPE
      const wx = W * 0.5, wy = H * 0.52
      const sz = Math.min(W, H) * 0.22

      // Worker silhouette (dark/shadowy)
      ctx.save()
      ctx.globalAlpha = 0.85

      // Shadow on floor
      ctx.beginPath()
      ctx.ellipse(wx, wy + sz * 0.55, sz * 0.45, sz * 0.1, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fill()

      // Body
      ctx.fillStyle = '#3a3a3a'
      ctx.beginPath()
      ctx.roundRect(wx - sz * 0.15, wy - sz * 0.48, sz * 0.3, sz * 0.5, sz * 0.03)
      ctx.fill()

      // Head (no helmet!)
      ctx.fillStyle = '#5a4030'
      ctx.beginPath()
      ctx.arc(wx, wy - sz * 0.62, sz * 0.14, 0, Math.PI * 2)
      ctx.fill()

      // Arms
      ctx.strokeStyle = '#3a3a3a'
      ctx.lineWidth = sz * 0.08
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(wx - sz * 0.15, wy - sz * 0.38)
      ctx.lineTo(wx - sz * 0.32, wy - sz * 0.1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(wx + sz * 0.15, wy - sz * 0.38)
      ctx.lineTo(wx + sz * 0.32, wy - sz * 0.08)
      ctx.stroke()

      // Legs
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = sz * 0.1
      ctx.beginPath()
      ctx.moveTo(wx - sz * 0.07, wy + sz * 0.02)
      ctx.lineTo(wx - sz * 0.1, wy + sz * 0.52)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(wx + sz * 0.07, wy + sz * 0.02)
      ctx.lineTo(wx + sz * 0.1, wy + sz * 0.52)
      ctx.stroke()

      ctx.restore()

      // NO alerts, NO detection — the point of the problem section
      // Just a blinking "UNMONITORED" text
      const blink = Math.sin(t * 1.5) > 0
      if (blink) {
        ctx.save()
        ctx.fillStyle = 'rgba(255,45,85,0.6)'
        ctx.font = '10px JetBrains Mono, monospace'
        ctx.textAlign = 'center'
        ctx.letterSpacing = '0.2em'
        ctx.fillText('UNMONITORED', wx, wy - sz * 0.9)
        ctx.restore()
      }

      // Timestamp
      const d = new Date(ts)
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.fillText(`REC ● ${d.toISOString().slice(11, 19)}`, 12, H - 14)

      // Corner overlay — "NO AI MONITORING"
      ctx.fillStyle = 'rgba(255,45,85,0.08)'
      ctx.strokeStyle = 'rgba(255,45,85,0.2)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.strokeRect(6, 6, W - 12, H - 12)
      ctx.setLineDash([])

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}

export default function ProblemSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const problems = [
    { num: '01', title: 'Manual & Inconsistent', desc: 'Supervisors cannot watch every corner simultaneously. Coverage gaps are inevitable.' },
    { num: '02', title: 'Reactive, Not Preventive', desc: 'Violations are discovered after incidents occur — not before lives are at risk.' },
    { num: '03', title: 'No Data, No Patterns', desc: 'Without continuous logging, there\'s no way to identify recurring risk hotspots.' },
    { num: '04', title: 'Compliance Theater', desc: 'Spot checks create compliance only when supervisors are present. Not otherwise.' },
  ]

  return (
    <section className="section problem-section" ref={ref} id="solutions">
      <div className="problem-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div
            className="problem-canvas-area"
            initial={{ opacity: 0, x: -60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 0 80px rgba(255,45,85,0.08), 0 30px 80px rgba(0,0,0,0.6)' }}
          >
            <ProblemCanvas />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '24px',
              background: 'linear-gradient(to top, rgba(255,45,85,0.12), transparent)',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,45,85,0.8)' }}>
                ● LIVE FEED — NO AI MONITORING ACTIVE
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
            style={{
              padding: '20px',
              background: 'rgba(255,45,85,0.05)',
              border: '1px solid rgba(255,45,85,0.15)',
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              borderRadius: 4,
            }}
          >
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: '#FF2D55', letterSpacing: '0.02em', lineHeight: 1, fontWeight: 700 }}>$7B+</div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: '0.06em', color: '#F0EDE8' }}>Annual industrial injury cost</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 300, color: 'rgba(240,237,232,0.4)', marginTop: 3, letterSpacing: '0.04em' }}>95% of incidents are preventable</div>
            </div>
          </motion.div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="section-label">The Problem</div>
            <h2 className="section-title-xl" style={{ marginBottom: 32, lineHeight: 1.2 }}>
              Manual<br />monitoring is<br /><em>broken.</em>
            </h2>
          </motion.div>

          <div className="problem-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 24 }}>
            {problems.map((p, i) => (
              <motion.div
                key={p.num}
                className="problem-card"
                initial={{ opacity: 0, x: 40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.08 + 0.2, duration: 0.6 }}
              >
                <div className="problem-card-num">— {p.num}</div>
                <div className="problem-card-title">{p.title}</div>
                <div className="problem-card-desc">{p.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}