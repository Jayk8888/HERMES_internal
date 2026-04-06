import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Check your email</h1>
      <p style={{ color: 'gray', marginBottom: '2rem' }}>
        We sent a password reset link to <strong>{email}</strong>
      </p>
      <Link to="/login">Back to sign in</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Forgot password</h1>
      <p style={{ marginBottom: '2rem', color: 'gray' }}>
        Remember it? <Link to="/login">Sign in</Link>
      </p>
      {error && (
        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </div>
  )
}