import { createClient } from '@supabase/supabase-js'
 
// Add these to your .env file:
// VITE_SUPABASE_URL=your_project_url
// VITE_SUPABASE_ANON_KEY=your_anon_key
 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const MOCK_SESSION_KEY = 'safeguard-ai-mock-session'
const MOCK_AUTH_EVENT = 'safeguard-ai-auth-change'
const MOCK_USER = {
  id: 'local-supervisor',
  email: 'supervisor@local.dev',
  user_metadata: {
    full_name: 'Local Supervisor',
  },
}
 
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

function readMockSession() {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(MOCK_SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    window.localStorage.removeItem(MOCK_SESSION_KEY)
    return null
  }
}

function writeMockSession(session) {
  if (typeof window === 'undefined') return

  if (session) {
    window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
  } else {
    window.localStorage.removeItem(MOCK_SESSION_KEY)
  }

  window.dispatchEvent(new CustomEvent(MOCK_AUTH_EVENT, { detail: session }))
}

function createMockSession() {
  return {
    access_token: 'local-dev-token',
    token_type: 'bearer',
    user: MOCK_USER,
  }
}

export function subscribeToAuthChanges(callback) {
  if (isSupabaseConfigured) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })

    return () => subscription.unsubscribe()
  }

  const handler = (event) => {
    callback(event.detail ?? readMockSession())
  }

  window.addEventListener(MOCK_AUTH_EVENT, handler)
  return () => window.removeEventListener(MOCK_AUTH_EVENT, handler)
}
 
// Auth helpers
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured) {
    const session = createMockSession()
    writeMockSession(session)
    return { data: { session }, error: null }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })
  return { data, error }
}
 
export const signOut = async () => {
  if (!isSupabaseConfigured) {
    writeMockSession(null)
    return { error: null }
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}
 
export const getSession = async () => {
  if (!isSupabaseConfigured) {
    return { session: readMockSession(), error: null }
  }

  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}
