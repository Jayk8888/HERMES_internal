import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthShell from '../components/layout/AuthShell'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import TextInput from '../components/ui/TextInput'
import { signIn } from '../features/auth/authService'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Login() {
  const { profile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn({ email, password })
    } catch (requestError) {
      setError(requestError.message)
      setLoading(false)
    }
  }

  if (profile?.role === 'patient') return <Navigate to="/patient" replace />
  if (profile?.role === 'doctor') return <Navigate to="/doctor" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />

  return (
    <AuthShell
      eyebrow="Access"
      title="Sign in to HERMES"
      description="Return to your patient or doctor workspace to manage appointments, availability, and records."
      footer={(
        <>
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/signup">
            Create one
          </Link>
        </>
      )}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? <ErrorMessage message={error} /> : null}

        <Field label="Email address" htmlFor="email" required>
          <TextInput
            id="email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          required
          action={(
            <Link className="text-xs font-semibold text-primary-700 hover:text-primary-800" to="/forgot-password">
              Forgot password?
            </Link>
          )}
        >
          <TextInput
            id="password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />
        </Field>

        <Button type="submit" loading={loading} block>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
