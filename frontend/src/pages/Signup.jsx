import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../features/auth/authService'

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [gender, setGender] = useState('male')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp({ email, password, fullName, role, gender })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      

      <div className="signup-root">
        <div className="signup-card">
          <h1 className="signup-heading">Create account</h1>
          <p className="signup-subheading">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>

          {error && <div className="signup-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Full name</label>
              <div className={`field-wrap${focused === 'name' ? ' focused' : ''}`}>
                <span className="field-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  className="field-input"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Email address</label>
              <div className={`field-wrap${focused === 'email' ? ' focused' : ''}`}>
                <span className="field-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  className="field-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Password</label>
              <div className={`field-wrap${focused === 'password' ? ' focused' : ''}`}>
                <span className="field-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  className="field-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">I am a</label>
              <div className="toggle-group">
                {['patient', 'doctor'].map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`toggle-btn${role === r ? ' active' : ''}`}
                    onClick={() => setRole(r)}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Gender</label>
              <div className="toggle-group">
                {['male', 'female', 'other'].map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`toggle-btn${gender === g ? ' active' : ''}`}
                    onClick={() => setGender(g)}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button className="signup-btn" type="submit" disabled={loading}>
              {loading && <span className="signup-btn-spinner" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}