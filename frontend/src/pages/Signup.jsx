import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/layout/AuthShell'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import TextInput from '../components/ui/TextInput'
import { signUp } from '../features/auth/authService'
import { cn } from '../lib/cn'

const ROLE_OPTIONS = ['patient', 'doctor', 'admin']
const GENDER_OPTIONS = ['male', 'female', 'other']

function ToggleGroup({ value, onChange, options }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-2xl border px-4 py-2.5 text-sm font-semibold capitalize transition-colors',
            value === option
              ? 'border-primary-500 bg-primary-50 text-primary-800'
              : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-700'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [gender, setGender] = useState('male')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp({ email, password, fullName, role, gender })
      navigate('/')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Registration"
      title="Create your HERMES account"
      description="Choose your role, capture your identity details, and continue into the correct workspace, including admin demo access."
      footer={(
        <>
          Already have an account?{' '}
          <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/login">
            Sign in
          </Link>
        </>
      )}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? <ErrorMessage message={error} /> : null}

        <Field label="Full name" htmlFor="full-name" required>
          <TextInput
            id="full-name"
            value={fullName}
            onChange={event => setFullName(event.target.value)}
            placeholder="Enter your full name"
            required
          />
        </Field>

        <Field label="Email address" htmlFor="signup-email" required>
          <TextInput
            id="signup-email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field label="Password" htmlFor="signup-password" hint="Minimum 6 characters" required>
          <TextInput
            id="signup-password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Create a password"
            minLength={6}
            required
          />
        </Field>

        <Field label="I am joining as" required>
          <ToggleGroup value={role} onChange={setRole} options={ROLE_OPTIONS} />
        </Field>

        <Field label="Gender" required>
          <ToggleGroup value={gender} onChange={setGender} options={GENDER_OPTIONS} />
        </Field>

        <Button type="submit" loading={loading} block>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
