import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Home() {
  const { user, profile, loading } = useAuth()

  if (loading) return <p>Loading...</p>

  if (!user) return <Navigate to="/login" replace />

  if (profile?.role === 'doctor') return <Navigate to="/doctor" replace />

  return <Navigate to="/patient" replace />
}
