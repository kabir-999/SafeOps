import { useEffect, useRef } from 'react'
import backgroundVideo from '../assets/Warehouse_Video_Generation_Request.mp4'

// ── 3D-style canvas renderer using perspective projection ──
export default function HeroCanvas({ scrollY }) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const rafRef = useRef(null)
  const timeRef = useRef(0)

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

    const W = () => canvas.offsetWidth
    const H = () => canvas.offsetHeight

    // ── 3D projection ──
    const project = (x, y, z, camZ = 800, scrollOffset = 0) => {
      const fov = camZ + scrollOffset * 0.5
      const scale = fov / (fov + z)
      return {
        x: W() / 2 + x * scale,
        y: H() / 2 + y * scale,
        scale,
      }
    }

    // ── Helmet object (left side) ──
    const drawHelmet = (ctx, cx, cy, sz, t, alpha) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(cx, cy)

      // Shadow
      ctx.beginPath()
      ctx.ellipse(0, sz * 0.52, sz * 0.55, sz * 0.12, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fill()

      // Base brim
      ctx.beginPath()
      ctx.ellipse(0, sz * 0.42, sz * 0.62, sz * 0.15, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#e6a100'
      ctx.fill()

      // Dome gradient
      const domeGrad = ctx.createRadialGradient(-sz*0.1, -sz*0.2, sz*0.05, 0, 0, sz*0.55)
      domeGrad.addColorStop(0, '#ffe066')
      domeGrad.addColorStop(0.4, '#FFB800')
      domeGrad.addColorStop(1, '#c47c00')
      ctx.beginPath()
      ctx.arc(0, 0, sz * 0.5, Math.PI, 0)
      ctx.lineTo(sz * 0.5, sz * 0.35)
      ctx.arc(0, sz * 0.35, sz * 0.5, 0, Math.PI)
      ctx.closePath()
      ctx.fillStyle = domeGrad
      ctx.fill()

      // Orange stripe
      ctx.save()
      ctx.beginPath()
      ctx.arc(0, 0, sz * 0.5, Math.PI, 0)
      ctx.lineTo(sz * 0.5, sz * 0.35)
      ctx.arc(0, sz * 0.35, sz * 0.5, 0, Math.PI)
      ctx.closePath()
      ctx.clip()

      ctx.fillStyle = '#FF6B1A'
      ctx.fillRect(-sz * 0.6, sz * 0.05, sz * 1.2, sz * 0.18)

      // Black stripes
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = sz * 0.06
      ctx.beginPath()
      ctx.moveTo(-sz * 0.35, -sz * 0.4)
      ctx.quadraticCurveTo(0, sz * 0.1, sz * 0.35, -sz * 0.4)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-sz * 0.5, -sz * 0.05)
      ctx.quadraticCurveTo(0, sz * 0.35, sz * 0.5, -sz * 0.05)
      ctx.stroke()
      ctx.restore()

      // Highlight
      ctx.beginPath()
      ctx.ellipse(-sz * 0.1, -sz * 0.2, sz * 0.15, sz * 0.1, -0.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fill()

      // Cinematic glow
      const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 1.2)
      glowGrad.addColorStop(0, 'rgba(255,184,0,0.08)')
      glowGrad.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(0, 0, sz * 1.2, 0, Math.PI * 2)
      ctx.fillStyle = glowGrad
      ctx.fill()

      ctx.restore()
    }

    // ── Cement truck (right side) ──
    const drawTruck = (ctx, cx, cy, sz, t, alpha) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(cx, cy)

      const s = sz / 80

      // Shadow
      ctx.beginPath()
      ctx.ellipse(0, sz * 0.55, sz * 1.1, sz * 0.15, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fill()

      // Truck body
      ctx.fillStyle = '#2a2a2a'
      ctx.beginPath()
      ctx.roundRect(-sz * 0.8, -sz * 0.18, sz * 0.55, sz * 0.52, 4 * s)
      ctx.fill()

      // Cab
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.roundRect(-sz * 0.8, -sz * 0.35, sz * 0.5, sz * 0.35, [8*s, 8*s, 0, 0])
      ctx.fill()

      // Cab yellow accent
      ctx.fillStyle = '#FFB800'
      ctx.beginPath()
      ctx.roundRect(-sz * 0.78, -sz * 0.33, sz * 0.46, sz * 0.28, [6*s, 6*s, 0, 0])
      ctx.fill()

      // Windshield
      ctx.fillStyle = 'rgba(100,150,200,0.6)'
      ctx.beginPath()
      ctx.roundRect(-sz * 0.7, -sz * 0.3, sz * 0.3, sz * 0.2, 3*s)
      ctx.fill()
      ctx.strokeStyle = '#333'
      ctx.lineWidth = s
      ctx.stroke()

      // Truck frame
      ctx.fillStyle = '#333'
      ctx.fillRect(-sz * 0.82, sz * 0.3, sz * 1.6, sz * 0.08)

      // Drum
      ctx.save()
      ctx.translate(sz * 0.15, -sz * 0.05)
      ctx.rotate(t * 0.8)
      const drumGrad = ctx.createLinearGradient(-sz * 0.32, 0, sz * 0.32, 0)
      drumGrad.addColorStop(0, '#888')
      drumGrad.addColorStop(0.3, '#FFB800')
      drumGrad.addColorStop(0.6, '#e6a100')
      drumGrad.addColorStop(1, '#666')
      ctx.beginPath()
      ctx.ellipse(0, 0, sz * 0.35, sz * 0.52, 0.3, 0, Math.PI * 2)
      ctx.fillStyle = drumGrad
      ctx.fill()
      // Drum ribs
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 2 * s
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(a) * sz * 0.35, Math.sin(a) * sz * 0.52)
        ctx.stroke()
      }
      ctx.restore()

      // Wheels
      const wheels = [
        { x: -sz * 0.55, y: sz * 0.38 },
        { x: -sz * 0.22, y: sz * 0.38 },
        { x: sz * 0.18, y: sz * 0.38 },
        { x: sz * 0.48, y: sz * 0.38 },
      ]
      wheels.forEach(w => {
        // Tire
        const tireGrad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, sz * 0.14)
        tireGrad.addColorStop(0, '#3a3a3a')
        tireGrad.addColorStop(1, '#111')
        ctx.beginPath()
        ctx.arc(w.x, w.y, sz * 0.14, 0, Math.PI * 2)
        ctx.fillStyle = tireGrad
        ctx.fill()
        // Rim
        ctx.beginPath()
        ctx.arc(w.x, w.y, sz * 0.08, 0, Math.PI * 2)
        ctx.fillStyle = '#FFB800'
        ctx.fill()
        // Hub
        ctx.beginPath()
        ctx.arc(w.x, w.y, sz * 0.03, 0, Math.PI * 2)
        ctx.fillStyle = '#111'
        ctx.fill()
      })

      // Headlight glow
      const headlight = ctx.createRadialGradient(-sz*0.8, sz*0.05, 0, -sz*0.8, sz*0.05, sz*0.3)
      headlight.addColorStop(0, 'rgba(255,220,100,0.3)')
      headlight.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(-sz * 0.8, sz * 0.05, sz * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = headlight
      ctx.fill()

      ctx.restore()
    }

    // ── Workers (bottom) ──
    const drawWorkers = (ctx, cx, cy, sz, t, alpha) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(cx, cy)

      // Worker 1 (female, left)
      const w1x = -sz * 0.55
      ctx.save()
      ctx.translate(w1x, 0)
      // Body
      ctx.fillStyle = '#FF6B1A'
      ctx.beginPath()
      ctx.roundRect(-sz * 0.14, -sz * 0.55, sz * 0.28, sz * 0.52, sz * 0.04)
      ctx.fill()
      // Head
      ctx.fillStyle = '#FDBCB4'
      ctx.beginPath()
      ctx.arc(0, -sz * 0.68, sz * 0.14, 0, Math.PI * 2)
      ctx.fill()
      // Helmet
      ctx.fillStyle = '#FF6B1A'
      ctx.beginPath()
      ctx.arc(0, -sz * 0.72, sz * 0.16, Math.PI, 0)
      ctx.fill()
      // Arms
      ctx.strokeStyle = '#FF6B1A'
      ctx.lineWidth = sz * 0.08
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-sz * 0.14, -sz * 0.45)
      ctx.lineTo(-sz * 0.28, -sz * 0.25 + Math.sin(t) * sz * 0.05)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(sz * 0.14, -sz * 0.45)
      ctx.lineTo(sz * 0.3, -sz * 0.2 + Math.sin(t + 0.5) * sz * 0.05)
      ctx.stroke()
      // Legs
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = sz * 0.09
      ctx.beginPath()
      ctx.moveTo(-sz * 0.06, -sz * 0.03)
      ctx.lineTo(-sz * 0.1, sz * 0.28)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(sz * 0.06, -sz * 0.03)
      ctx.lineTo(sz * 0.1, sz * 0.28)
      ctx.stroke()
      ctx.restore()

      // Worker 2 (male, right)
      const w2x = sz * 0.35
      ctx.save()
      ctx.translate(w2x, 0)
      // Vest
      ctx.fillStyle = '#FF6B1A'
      ctx.beginPath()
      ctx.roundRect(-sz * 0.12, -sz * 0.52, sz * 0.24, sz * 0.16, sz * 0.03)
      ctx.fill()
      // Shirt
      ctx.fillStyle = '#F0EDE8'
      ctx.beginPath()
      ctx.roundRect(-sz * 0.13, -sz * 0.38, sz * 0.26, sz * 0.35, sz * 0.04)
      ctx.fill()
      // Head
      ctx.fillStyle = '#a07040'
      ctx.beginPath()
      ctx.arc(0, -sz * 0.65, sz * 0.14, 0, Math.PI * 2)
      ctx.fill()
      // Shovel
      ctx.save()
      ctx.translate(sz * 0.14, -sz * 0.25)
      ctx.rotate(0.3 + Math.sin(t * 0.8) * 0.08)
      ctx.strokeStyle = '#8B5E3C'
      ctx.lineWidth = sz * 0.04
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sz * 0.5, sz * 0.45)
      ctx.stroke()
      // Shovel head
      ctx.fillStyle = '#888'
      ctx.beginPath()
      ctx.ellipse(sz * 0.5, sz * 0.52, sz * 0.1, sz * 0.07, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      // Pants
      ctx.fillStyle = '#2d2416'
      ctx.beginPath()
      ctx.roundRect(-sz * 0.12, -sz * 0.03, sz * 0.24, sz * 0.3, sz * 0.02)
      ctx.fill()
      ctx.restore()

      // Cement mixer between them
      ctx.save()
      ctx.translate(0, -sz * 0.05)
      ctx.rotate(t * 0.5)
      // Drum
      ctx.fillStyle = '#c4783a'
      ctx.beginPath()
      ctx.ellipse(0, 0, sz * 0.22, sz * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = sz * 0.03
      ctx.stroke()
      // Spokes
      ctx.strokeStyle = '#8B5E3C'
      ctx.lineWidth = sz * 0.025
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * sz * 0.08, Math.sin(a) * sz * 0.11)
        ctx.lineTo(Math.cos(a) * sz * 0.22, Math.sin(a) * sz * 0.3)
        ctx.stroke()
      }
      ctx.restore()

      ctx.restore()
    }

    // ── Warning sign ──
    const drawSign = (ctx, cx, cy, sz, t, alpha) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(cx, cy)

      const bob = Math.sin(t * 0.7) * sz * 0.03

      // Legs
      ctx.strokeStyle = '#555'
      ctx.lineWidth = sz * 0.03
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-sz * 0.2, sz * 0.45)
      ctx.lineTo(-sz * 0.18, sz * 0.1 + bob)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(sz * 0.2, sz * 0.45)
      ctx.lineTo(sz * 0.18, sz * 0.1 + bob)
      ctx.stroke()

      ctx.translate(0, bob)

      // Sign body
      ctx.fillStyle = '#FFD700'
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = sz * 0.025
      ctx.beginPath()
      ctx.roundRect(-sz * 0.5, -sz * 0.28, sz, sz * 0.58, sz * 0.04)
      ctx.fill()
      ctx.stroke()

      // Hazard stripes on edges
      const stripeClip = new Path2D()
      stripeClip.roundRect(-sz * 0.5, -sz * 0.28, sz, sz * 0.58, sz * 0.04)
      ctx.save()
      ctx.clip(stripeClip)
      ctx.fillStyle = 'rgba(26,26,26,0.85)'
      for (let i = -8; i < 10; i++) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(-sz * 0.5, -sz * 0.28, sz * 0.12, sz * 0.58)
        ctx.fill()
        ctx.restore()
        ctx.save()
        ctx.beginPath()
        ctx.rect(sz * 0.38, -sz * 0.28, sz * 0.12, sz * 0.58)
        ctx.fill()
        ctx.restore()
      }
      ctx.restore()

      // Stripe pattern
      ctx.save()
      ctx.clip(stripeClip)
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = sz * 0.065
      for (let i = -6; i < 10; i++) {
        ctx.beginPath()
        ctx.moveTo(-sz * 0.5 + i * sz * 0.12, -sz * 0.28)
        ctx.lineTo(-sz * 0.5 + (i + 1) * sz * 0.12, sz * 0.3)
        ctx.stroke()
      }
      ctx.restore()

      // Center yellow background (for text)
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.roundRect(-sz * 0.36, -sz * 0.22, sz * 0.72, sz * 0.44, sz * 0.02)
      ctx.fill()

      // Sign text
      ctx.fillStyle = '#1a1a1a'
      ctx.font = `bold ${sz * 0.14}px 'Bebas Neue', sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('UNDER', 0, -sz * 0.04)
      ctx.fillText('CONSTRUCTION', 0, sz * 0.14)
      ctx.textAlign = 'left'

      // Bolts
      const bolts = [[-sz*0.43, -sz*0.21], [sz*0.43, -sz*0.21], [-sz*0.43, sz*0.22], [sz*0.43, sz*0.22]]
      bolts.forEach(([bx, by]) => {
        ctx.beginPath()
        ctx.arc(bx, by, sz * 0.025, 0, Math.PI * 2)
        ctx.fillStyle = '#888'
        ctx.fill()
      })

      ctx.restore()
    }

    // Main render loop
    const draw = (timestamp) => {
      const t = timestamp / 1000
      timeRef.current = t
      const w = W(), h = H()
      ctx.clearRect(0, 0, w, h)

      // Pure black bg
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h)

      // Fog/atmosphere layers
      const fog1 = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7)
      fog1.addColorStop(0, 'rgba(20,12,0,0)')
      fog1.addColorStop(1, 'rgba(0,0,0,0.6)')
      ctx.fillStyle = fog1
      ctx.fillRect(0, 0, w, h)

      // Grid floor (perspective)
      ctx.save()
      ctx.strokeStyle = 'rgba(255,107,26,0.06)'
      ctx.lineWidth = 1
      const horizon = h * 0.65
      const vp = { x: w / 2, y: horizon }
      for (let i = 0; i <= 20; i++) {
        const x = w * (i / 20)
        ctx.beginPath()
        ctx.moveTo(vp.x, vp.y)
        ctx.lineTo(x, h + 50)
        ctx.stroke()
      }
      for (let j = 0; j <= 12; j++) {
        const p = j / 12
        const perspY = horizon + (h - horizon) * (p * p)
        const perspX = w * 0.1 + (w * 0.8) * (1 - p * 0.6) / 2
        const perspW = w * 0.8 * (p * 0.6 + 0.4) / 1
        ctx.beginPath()
        ctx.moveTo(perspX, perspY)
        ctx.lineTo(perspX + perspW, perspY)
        ctx.stroke()
      }
      ctx.restore()

      // Ambient light shafts from above
      const numShafts = 3
      for (let i = 0; i < numShafts; i++) {
        const shaftX = w * (0.2 + i * 0.3) + Math.sin(t * 0.2 + i) * w * 0.05
        const shaftGrad = ctx.createLinearGradient(shaftX, 0, shaftX + 80, h)
        shaftGrad.addColorStop(0, 'rgba(255,184,0,0.04)')
        shaftGrad.addColorStop(0.5, 'rgba(255,107,26,0.02)')
        shaftGrad.addColorStop(1, 'transparent')
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(shaftX - 20, 0)
        ctx.lineTo(shaftX + 80, 0)
        ctx.lineTo(shaftX + 200, h)
        ctx.lineTo(shaftX - 60, h)
        ctx.closePath()
        ctx.fillStyle = shaftGrad
        ctx.fill()
        ctx.restore()
      }

      const vignette = ctx.createRadialGradient(w/2, h/2, w*0.2, w/2, h/2, w*0.85)
      vignette.addColorStop(0, 'transparent')
      vignette.addColorStop(1, 'rgba(0,0,0,0.7)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Video background setup
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.loop = true
    
    const playVideo = () => {
      video.play().catch((err) => {
        console.log('Video play failed:', err)
      })
    }

    // Try to play on mount
    playVideo()

    // Handle user interaction to trigger autoplay
    const handleUserInteraction = () => {
      playVideo()
    }

    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 10,
        }}
        muted
        loop
      >
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <canvas
        ref={canvasRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 1,
        }}
      />
    </div>
  )
}