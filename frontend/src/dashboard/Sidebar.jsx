import { motion } from 'framer-motion'
import { signOut } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { id: 'analytics', icon: '◧', label: 'Analytics' },
  { id: 'violations', icon: '⚠', label: 'Violations' },
  { id: 'zones', icon: '⊕', label: 'Zone Map' },
]

export default function DashboardSidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: 72,
        background: '#080808',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 0',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Logo icon */}
      <div style={{
        width: 36, height: 36,
        background: '#FF6B1A',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 36,
        boxShadow: '0 0 20px rgba(255,107,26,0.3)',
        cursor: 'pointer',
        flexShrink: 0,
      }} onClick={() => navigate('/')}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M10 1L18 5.5V14.5L10 19L2 14.5V5.5L10 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="10" cy="10" r="3" fill="white"/>
        </svg>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: 'none',
              background: activeTab === item.id ? 'rgba(255,107,26,0.15)' : 'transparent',
              color: activeTab === item.id ? '#FF6B1A' : 'rgba(240,237,232,0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              transition: 'all 0.2s',
              position: 'relative',
            }}
            onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent' }}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="sidebar-indicator"
                style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: 2,
                  background: '#FF6B1A',
                }}
              />
            )}
            <span>{item.icon}</span>
          </button>
        ))}
      </nav>

      {/* User avatar + signout */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="avatar"
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,107,26,0.2)',
            border: '1px solid rgba(255,107,26,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Oswald', sans-serif",
            fontSize: 13, color: '#FF6B1A',
          }}>
            {(user?.email?.[0] || 'S').toUpperCase()}
          </div>
        )}
        <button
          onClick={handleSignOut}
          title="Sign Out"
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent',
            color: 'rgba(240,237,232,0.3)',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FF2D55'; e.currentTarget.style.borderColor = 'rgba(255,45,85,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,237,232,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        >
          ⏻
        </button>
      </div>
    </motion.aside>
  )
}