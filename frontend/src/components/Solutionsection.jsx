import { useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'

function DetectionCanvas() {
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

    const workers = [
      { x: 0.28, y: 0.55, compliant: false, label: 'P2 — MISSING HELMET', id: 'W-02', conf: 97.1 },
      { x: 0.55, y: 0.5, compliant: true, label: 'P1 — COMPLIANT', id: 'W-01', conf: 99.2 },
      { x: 0.76, y: 0.6, compliant: true, label: 'P3 — COMPLIANT', id: 'W-03', conf: 98.7 },
    ]

    let startTime = null

    const draw = (ts) => {
      if (!startTime) startTime = ts
      const elapsed = (ts - startTime) / 1000
      const t = ts / 1000
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      // Dark industrial bg
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, W, H)

      // Scanlines
      for (let y = 0; y < H; y += 2) {
        ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'
        if (y % 4 === 0) ctx.fillRect(0, y, W, 1)
      }

      // Perspective grid floor
      const horizon = H * 0.4
      ctx.strokeStyle = 'rgba(255,107,26,0.06)'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= 14; i++) {
        const x = i * W / 14
        ctx.beginPath()
        ctx.moveTo(W / 2 + (x - W / 2) * 0.2, horizon)
        ctx.lineTo(x, H + 20)
        ctx.stroke()
      }
      for (let j = 0; j <= 10; j++) {
        const progress = j / 10
        const y = horizon + (H - horizon) * (progress * progress)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }

      // Workers with reveal animation
      workers.forEach((w, i) => {
        const revealDelay = i * 1.0 + 0.8
        const reveal = Math.max(0, Math.min(1, (elapsed - revealDelay) / 0.5))
        if (reveal === 0) return

        const wx = w.x * W, wy = w.y * H
        const sz = Math.min(W, H) * 0.18
        const bw = sz * 0.7, bh = sz
        const bx = wx - bw / 2, by = wy - bh * 0.8

        const [r, g, b] = w.compliant ? [0, 196, 140] : [255, 45, 85]
        const pulse = 0.6 + 0.4 * Math.sin(t * 3 + i)

        // Glow aura
        if (!w.compliant) {
          const aura = ctx.createRadialGradient(wx, wy, 0, wx, wy, sz * 1.2)
          aura.addColorStop(0, `rgba(${r},${g},${b},${0.1 * pulse * reveal})`)
          aura.addColorStop(1, 'transparent')
          ctx.save()
          ctx.globalAlpha = reveal
          ctx.fillStyle = aura
          ctx.beginPath()
          ctx.arc(wx, wy, sz * 1.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }

        ctx.save()
        ctx.globalAlpha = reveal

        // Bounding box fill
        ctx.fillStyle = `rgba(${r},${g},${b},0.04)`
        ctx.fillRect(bx, by, bw, bh)

        // Corner brackets
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.7 + 0.3 * pulse})`
        ctx.lineWidth = 2
        const c = 12
        ctx.beginPath()
        ctx.moveTo(bx + c, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + c)
        ctx.moveTo(bx + bw - c, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + c)
        ctx.moveTo(bx, by + bh - c); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + c, by + bh)
        ctx.moveTo(bx + bw - c, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - c)
        ctx.stroke()

        // Worker figure
        ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`
        ctx.lineWidth = 2

        // Head
        ctx.beginPath()
        ctx.arc(wx, wy - sz * 0.6, sz * 0.12, 0, Math.PI * 2)
        ctx.stroke()

        // Helmet (or missing indicator)
        if (w.compliant) {
          ctx.fillStyle = 'rgba(255,184,0,0.9)'
          ctx.beginPath()
          ctx.arc(wx, wy - sz * 0.6, sz * 0.15, Math.PI, 0)
          ctx.fill()
        } else {
          // X over head area
          ctx.strokeStyle = `rgba(255,45,85,0.8)`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(wx - sz * 0.12, wy - sz * 0.75)
          ctx.lineTo(wx + sz * 0.12, wy - sz * 0.47)
          ctx.moveTo(wx + sz * 0.12, wy - sz * 0.75)
          ctx.lineTo(wx - sz * 0.12, wy - sz * 0.47)
          ctx.stroke()
        }

        // Body
        ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`
        ctx.beginPath()
        ctx.moveTo(wx, wy - sz * 0.48)
        ctx.lineTo(wx, wy - sz * 0.18)
        ctx.moveTo(wx - sz * 0.2, wy - sz * 0.4)
        ctx.lineTo(wx + sz * 0.2, wy - sz * 0.4)
        ctx.moveTo(wx, wy - sz * 0.18)
        ctx.lineTo(wx - sz * 0.14, wy + sz * 0.1)
        ctx.moveTo(wx, wy - sz * 0.18)
        ctx.lineTo(wx + sz * 0.14, wy + sz * 0.1)
        ctx.stroke()

        // Label pill
        const labelW = ctx.measureText(w.label).width + 24
        const lx = wx - labelW / 2, ly = by - 30

        ctx.fillStyle = `rgba(${r},${g},${b},0.92)`
        ctx.beginPath()
        ctx.roundRect(lx, ly, labelW, 22, 3)
        ctx.fill()

        ctx.fillStyle = '#fff'
        ctx.font = `bold 9px 'JetBrains Mono', monospace`
        ctx.textAlign = 'center'
        ctx.fillText(w.label, wx, ly + 14)
        ctx.textAlign = 'left'

        // Confidence score
        ctx.fillStyle = `rgba(${r},${g},${b},0.5)`
        ctx.font = `9px 'JetBrains Mono', monospace`
        ctx.fillText(`${w.conf}%`, bx, by + bh + 14)

        ctx.restore()
      })

      // AI scan line
      ctx.save()
      const scanProgress = (t * 0.7) % 1
      const scanY = H * 0.1 + scanProgress * H * 0.8
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30)
      scanGrad.addColorStop(0, 'transparent')
      scanGrad.addColorStop(0.5, 'rgba(26,86,255,0.08)')
      scanGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 30, W, 60)
      ctx.restore()

      // HUD elements
      ctx.save()
      ctx.fillStyle = 'rgba(26,86,255,0.6)'
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.fillText(`SAFEGUARD AI v2.4 · YOLOv8-SAFETY · ${Math.round(26 + Math.sin(t) * 2)} FPS · ${Math.round(182 + Math.sin(t * 2) * 8)}ms`, 12, H - 12)

      ctx.fillStyle = 'rgba(0,196,140,0.8)'
      ctx.font = 'bold 9px JetBrains Mono, monospace'
      ctx.textAlign = 'right'
      ctx.fillText('● DETECTION ACTIVE', W - 12, H - 12)
      ctx.textAlign = 'left'
      ctx.restore()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}

export default function SolutionSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="section solution-section" ref={ref}>
      <div className="solution-layout">
        <motion.div
          className="detection-frame"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <DetectionCanvas />
        </motion.div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <div className="section-label">The Solution</div>
            <h2 className="section-title-xl" style={{ marginBottom: 24 }}>
              Detection<br />into <em>prevention</em>
            </h2>
            <p className="section-body" style={{ marginBottom: 40 }}>
              Our CV model scans every frame in real time. The moment a worker enters a zone without required PPE — the system acts immediately.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
          >
            {[
              { color: '#FF2D55', dot: '●', label: 'Non-Compliant Worker', desc: 'Red box + instant alert dispatched to supervisor dashboard' },
              { color: '#00C48C', dot: '●', label: 'Compliant Worker', desc: 'Green confirmation — no action required, continuous monitoring active' },
              { color: '#FF6B1A', dot: '●', label: 'Hazard Zone Entry', desc: 'Zone-specific PPE rules enforced. Alerts trigger on entry without gear' },
            ].map((item, i) => (
              <div key={item.label} style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}>
                <span style={{ color: item.color, fontSize: 10, marginTop: 5, flexShrink: 0 }}>{item.dot}</span>
                <div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 500, letterSpacing: '0.08em', color: '#F0EDE8', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 300, letterSpacing: '0.03em', color: 'rgba(240,237,232,0.45)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}