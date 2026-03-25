import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('loading') // loading | exit

  useEffect(() => {
    // Simulate asset loading with realistic timing
    const steps = [
      { target: 18, delay: 0, duration: 400 },
      { target: 42, delay: 450, duration: 600 },
      { target: 67, delay: 1100, duration: 500 },
      { target: 85, delay: 1700, duration: 400 },
      { target: 100, delay: 2200, duration: 500 },
    ]

    steps.forEach(({ target, delay, duration }) => {
      setTimeout(() => {
        const start = Date.now()
        const startVal = progress
        const animate = () => {
          const elapsed = Date.now() - start
          const p = Math.min(elapsed / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setProgress(Math.round(startVal + (target - startVal) * ease))
          if (p < 1) requestAnimationFrame(animate)
        }
        animate()
      }, delay)
    })

    setTimeout(() => {
      setPhase('exit')
      setTimeout(onComplete, 900)
    }, 3200)
  }, [])

  return (
    <AnimatePresence>
      {phase === 'loading' && (
        <motion.div
          className="loading-screen"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute',
            top: '40%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600, height: 300,
            background: 'radial-gradient(ellipse, rgba(255,184,0,0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
            pointerEvents: 'none'
          }} />

          <motion.div
            className="loading-sign-wrap"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* The sign */}
            <div className="loading-sign">
              {/* Hazard stripes (left) */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 14,
                background: 'repeating-linear-gradient(45deg, #1a1a1a 0, #1a1a1a 10px, #FFD700 10px, #FFD700 20px)',
                borderRadius: '6px 0 0 6px'
              }} />
              {/* Hazard stripes (right) */}
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 14,
                background: 'repeating-linear-gradient(-45deg, #1a1a1a 0, #1a1a1a 10px, #FFD700 10px, #FFD700 20px)',
                borderRadius: '0 6px 6px 0'
              }} />
              <div className="loading-sign-text">
                UNDER<br />CONSTRUCTION
              </div>
            </div>

            {/* Legs */}
            <div className="loading-sign-legs">
              <div className="loading-sign-leg" />
              <div className="loading-sign-leg" />
            </div>

            {/* Status text */}
            <motion.div
              style={{ textAlign: 'center', marginTop: 8 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(240,237,232,0.4)'
              }}>
                Initialising SafeGuard AI
              </span>
            </motion.div>
          </motion.div>

          {/* Progress */}
          <motion.div
            className="loading-progress-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="loading-progress-track">
              <motion.div
                className="loading-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="loading-pct">{progress}%</div>
          </motion.div>

          {/* Corner decorations */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
            <div key={pos} style={{
              position: 'absolute',
              ...(pos.includes('top') ? { top: 24 } : { bottom: 24 }),
              ...(pos.includes('left') ? { left: 24 } : { right: 24 }),
              width: 20, height: 20,
              borderTop: pos.includes('top') ? '1px solid rgba(255,107,26,0.3)' : 'none',
              borderBottom: pos.includes('bottom') ? '1px solid rgba(255,107,26,0.3)' : 'none',
              borderLeft: pos.includes('left') ? '1px solid rgba(255,107,26,0.3)' : 'none',
              borderRight: pos.includes('right') ? '1px solid rgba(255,107,26,0.3)' : 'none',
            }} />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}