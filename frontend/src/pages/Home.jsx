import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const [doctorExists, setDoctorExists] = useState(null)
  const [patientExists, setPatientExists] = useState(null)

  useEffect(() => {
    if (profile?.role !== 'doctor' || !user) return
    supabase
      .from('doctors')
      .select('id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setDoctorExists(!!data))
  }, [user, profile])

  useEffect(() => {
    if (profile?.role !== 'patient' || !user) return
    supabase
      .from('patients')
      .select('id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setPatientExists(!!data))
  }, [user, profile])

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

  return <Navigate to="/patient" replace />
}
