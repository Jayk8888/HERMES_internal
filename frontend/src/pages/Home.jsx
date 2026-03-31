import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const [doctorExists, setDoctorExists] = useState(null)

  useEffect(() => {
    if (profile?.role !== 'doctor' || !user) return
    supabase
      .from('doctors')
      .select('id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setDoctorExists(!!data))
  }, [user, profile])

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  if (profile?.role === 'doctor') {
    if (doctorExists === null) return null
    if (!doctorExists) return <Navigate to="/doctor/complete-profile" replace />
    return <Navigate to="/doctor" replace />
  }

  return <Navigate to="/patient" replace />
}
