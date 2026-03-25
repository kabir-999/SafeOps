import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ZONE_LAYOUT } from '../lib/mockData'

// ══════════════════════════════════════════════
//  ZONE MAP TAB — Heatmap
// ══════════════════════════════════════════════

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function ZoneHeatmapCanvas({ persons }) {
  const ref = useRef(null)

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

    let prog = 0
    const draw = () => {
      prog = Math.min(prog + 0.02, 1)
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      ctx.fillStyle = '#07090e'
      ctx.fillRect(0, 0, W, H)

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // Zones
      Object.entries(ZONE_LAYOUT).forEach(([name, z]) => {
        const zx = z.x * W, zy = z.y * H, zw = z.w * W, zh = z.h * H
        const hex = z.color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)

        ctx.save()
        ctx.fillStyle = `rgba(${r},${g},${b},0.04)`
        ctx.strokeStyle = `rgba(${r},${g},${b},0.25)`
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 4])
        ctx.fillRect(zx, zy, zw, zh)
        ctx.strokeRect(zx, zy, zw, zh)
        ctx.setLineDash([])
        ctx.fillStyle = `rgba(${r},${g},${b},0.7)`
        ctx.font = `bold 10px 'JetBrains Mono', monospace`
        ctx.fillText(name.toUpperCase(), zx + 8, zy + 16)
        ctx.restore()
      })

      // Heatmap blobs per person
      persons.forEach((p) => {
        const px = (p.x / 1000) * W
        const py = (p.y / 600) * H
        const intensity = prog * (p.risk_score / 10 + 0.3)
        const radius = 80 * prog

        const isHigh = p.risk_score >= 7
        const isMed = p.risk_score >= 4

        const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius)
        if (isHigh) {
          gradient.addColorStop(0, `rgba(255,45,85,${0.5 * intensity})`)
          gradient.addColorStop(0.4, `rgba(255,107,26,${0.25 * intensity})`)
          gradient.addColorStop(1, 'transparent')
        } else if (isMed) {
          gradient.addColorStop(0, `rgba(255,184,0,${0.4 * intensity})`)
          gradient.addColorStop(1, 'transparent')
        } else {
          gradient.addColorStop(0, `rgba(0,196,140,${0.3 * intensity})`)
          gradient.addColorStop(1, 'transparent')
        }

        ctx.fillStyle = gradient
        ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill()

        // Person dot
        const c = isHigh ? '#FF2D55' : isMed ? '#FFB800' : '#00C48C'
        ctx.fillStyle = c
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill()

        // ID
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.beginPath()
        roundRect(ctx, px - 14, py - 22, 28, 14, 3)
        ctx.fill()
        ctx.fillStyle = c
        ctx.font = `bold 8px 'JetBrains Mono', monospace`
        ctx.textAlign = 'center'
        ctx.fillText(p.id, px, py - 12)
        ctx.textAlign = 'left'
      })

      if (prog < 1) requestAnimationFrame(draw)
      else requestAnimationFrame(draw) // keep running for animation
    }
    requestAnimationFrame(draw)
    return () => window.removeEventListener('resize', resize)
  }, [persons])

  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
}

export function ZoneMapTab({ detections }) {
  const persons = detections?.persons || []

  // Zone stats
  const zoneStats = {}
  persons.forEach(p => {
    if (!zoneStats[p.area]) zoneStats[p.area] = { total: 0, violations: 0, avgRisk: 0 }
    zoneStats[p.area].total++
    if (p.violations.length > 0) zoneStats[p.area].violations++
    zoneStats[p.area].avgRisk += p.risk_score
  })
  Object.keys(zoneStats).forEach(z => {
    zoneStats[z].avgRisk = (zoneStats[z].avgRisk / zoneStats[z].total).toFixed(1)
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 4,
        overflow: 'hidden',
        minHeight: 540,
      }}>
        <ZoneHeatmapCanvas persons={persons} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 4,
          padding: '16px',
        }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)', marginBottom: 12 }}>
            Zone Risk Heatmap
          </div>
          {/* Legend */}
          {[
            { color: '#FF2D55', label: 'High Risk (score 7-10)', range: 'Critical violations' },
            { color: '#FFB800', label: 'Medium Risk (4-6)', range: 'Minor violations' },
            { color: '#00C48C', label: 'Low Risk (0-3)', range: 'Compliant' },
          ].map(l => (
            <div key={l.color} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 400, color: 'rgba(240,237,232,0.6)' }}>{l.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(240,237,232,0.25)', marginTop: 1 }}>{l.range}</div>
              </div>
            </div>
          ))}
        </div>

        {Object.entries(ZONE_LAYOUT).map(([name, z]) => {
          const stats = zoneStats[name] || { total: 0, violations: 0, avgRisk: '0.0' }
          const compliance = stats.total > 0 ? Math.round(((stats.total - stats.violations) / stats.total) * 100) : 100
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderLeft: `3px solid ${z.color}`,
                borderRadius: 4,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 500, letterSpacing: '0.06em', color: '#F0EDE8' }}>{name}</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.02em', color: z.color }}>{stats.total}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${compliance}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{ height: '100%', background: z.color, borderRadius: 2 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(240,237,232,0.3)' }}>{compliance}% compliant</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: stats.violations > 0 ? '#FF2D55' : '#00C48C' }}>
                  {stats.violations} violation{stats.violations !== 1 ? 's' : ''}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}