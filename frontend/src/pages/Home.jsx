import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'

const HOME_LOOKUP_TIMEOUT_MS = 2500

export default function Home() {
  const { user, profile, loading } = useAuth()
  const [doctorLookup, setDoctorLookup] = useState({ userId: null, exists: null })
  const [patientLookup, setPatientLookup] = useState({ userId: null, exists: null })

  useEffect(() => {
    if (profile?.role !== 'doctor' || !user?.id) return undefined

    let active = true
    const currentUserId = user.id
    const timeoutId = window.setTimeout(() => {
      if (active) {
        setDoctorLookup({ userId: currentUserId, exists: true })
      }
    }, HOME_LOOKUP_TIMEOUT_MS)

    void supabase
      .from('doctors')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return

        window.clearTimeout(timeoutId)

        if (error) {
          console.error('Failed to confirm doctor profile completion:', error.message)
          setDoctorLookup({ userId: currentUserId, exists: true })
          return
        }

        setDoctorLookup({ userId: currentUserId, exists: Boolean(data) })
      })

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [user?.id, profile?.role])

  useEffect(() => {
    if (profile?.role !== 'patient' || !user?.id) return undefined

    let active = true
    const currentUserId = user.id
    const timeoutId = window.setTimeout(() => {
      if (active) {
        setPatientLookup({ userId: currentUserId, exists: true })
      }
    }, HOME_LOOKUP_TIMEOUT_MS)

    void supabase
      .from('patients')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return

        window.clearTimeout(timeoutId)

        if (error) {
          console.error('Failed to confirm patient profile completion:', error.message)
          setPatientLookup({ userId: currentUserId, exists: true })
          return
        }

        setPatientLookup({ userId: currentUserId, exists: Boolean(data) })
      })

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [user?.id, profile?.role])

  const doctorExists = doctorLookup.userId === user?.id ? doctorLookup.exists : null
  const patientExists = patientLookup.userId === user?.id ? patientLookup.exists : null

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  if (profile?.role === 'doctor') {
    if (doctorExists === null) return null
    if (!doctorExists) return <Navigate to="/doctor/complete-profile" replace />
    return <Navigate to="/doctor" replace />
  }

  if (profile?.role === 'patient') {
    if (patientExists === null) return null
    if (!patientExists) return <Navigate to="/patient/complete-profile" replace />
    return <Navigate to="/patient" replace />
  }

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/patient" replace />
}
