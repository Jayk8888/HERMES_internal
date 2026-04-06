import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { signOut } from '../features/auth/authService.js'

export default function Unauthorized() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 1rem', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Access denied</h1>
      <p style={{ color: 'gray', marginBottom: '2rem' }}>
        You don't have permission to view that page (or your account was reset).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <Link to={profile?.role === 'doctor' ? '/doctor' : '/patient'} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px', textDecoration: 'none', color: '#333' }}>
          Go to my dashboard
        </Link>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', background: '#f5f5f5', color: '#333' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
