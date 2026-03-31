import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../features/auth/authService'

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp({ email, password, fullName, role })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Create account</h1>
      <p style={{ marginBottom: '2rem', color: 'gray' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>

      {error && (
        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label>I am a</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setRole('patient')}
              style={{ flex: 1, padding: '0.5rem', fontWeight: role === 'patient' ? 'bold' : 'normal' }}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              style={{ flex: 1, padding: '0.5rem', fontWeight: role === 'doctor' ? 'bold' : 'normal' }}
            >
              Doctor
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  )
}