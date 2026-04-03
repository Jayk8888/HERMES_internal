import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile } from '../features/auth/authService'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const latestUserIdRef = useRef(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    async function fetchProfile(userId) {
      try {
        const nextProfile = await getProfile(userId)
        if (!mounted) return
        latestUserIdRef.current = userId
        setProfile(nextProfile)
      } catch (error) {
        console.error('Failed to fetch profile:', error.message)
        if (mounted) {
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
          initializedRef.current = true
        }
      }
    }

    async function restoreSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        const nextUser = session?.user ?? null
        setUser(nextUser)
        latestUserIdRef.current = nextUser?.id ?? null

        if (nextUser) {
          await fetchProfile(nextUser.id)
        } else {
          setLoading(false)
          initializedRef.current = true
        }
      } catch (error) {
        console.error('Failed to restore session:', error.message)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
        initializedRef.current = true
      }
    }

    void restoreSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION') return

        const nextUser = session?.user ?? null
        const nextUserId = nextUser?.id ?? null
        const sameUser = latestUserIdRef.current === nextUserId

        setUser(nextUser)
        latestUserIdRef.current = nextUserId

        if (nextUser) {
          if (sameUser && initializedRef.current) {
            return
          }

          setLoading(true)
          setTimeout(() => {
            void fetchProfile(nextUser.id)
          }, 0)
        } else {
          setProfile(null)
          setLoading(false)
          initializedRef.current = true
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
