import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn } from '../features/auth/authService'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn({ email, password })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (profile?.role === 'patient') navigate('/patient')
  if (profile?.role === 'doctor') navigate('/doctor')

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Sign in</h1>
      <p style={{ marginBottom: '2rem', color: 'gray' }}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
      {error && (
        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
          <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'gray', display: 'block', marginTop: 4 }}>
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}