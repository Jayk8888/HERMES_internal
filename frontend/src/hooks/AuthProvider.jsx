import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile } from '../features/auth/authService'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchProfile(userId) {
      try {
        const nextProfile = await getProfile(userId)
        if (!mounted) return
        setProfile(nextProfile)
      } catch (error) {
        console.error('Failed to fetch profile:', error.message)
        if (mounted) {
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    async function restoreSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to restore session:', error.message)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    void restoreSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return

        setUser(session?.user ?? null)

        if (session?.user) {
          setLoading(true)
          setTimeout(() => {
            void fetchProfile(session.user.id)
          }, 0)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
