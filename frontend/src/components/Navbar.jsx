import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="nav-logo">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 1L18 5.5V14.5L10 19L2 14.5V5.5L10 1Z" stroke="#FF6B1A" strokeWidth="1.5" fill="none"/>
          <circle cx="10" cy="10" r="3" fill="#FF6B1A"/>
        </svg>
        <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>
          SAFEGUARD<span>AI</span>
        </a>
      </div>

      <ul className="nav-links">
        {['Solutions', 'Analytics'].map(item => (
          <li key={item}>
            <a href={`#${item.toLowerCase()}`}>{item}</a>
          </li>
        ))}
      </ul>

      <button className="nav-cta" onClick={() => window.location.href = '/dashboard'}>
        Dashboard →
      </button>
    </motion.nav>
  )
}