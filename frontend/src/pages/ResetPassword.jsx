import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/layout/AuthShell'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import TextInput from '../components/ui/TextInput'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      navigate('/login')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Choose a new password"
      description="Set a fresh password for your HERMES account and return to sign in."
      footer={(
        <>
          Need a new link?{' '}
          <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/forgot-password">
            Request another reset email
          </Link>
        </>
      )}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? <ErrorMessage message={error} /> : null}

        <Field label="New password" htmlFor="new-password" hint="Minimum 6 characters" required>
          <TextInput
            id="new-password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Enter a new password"
            minLength={6}
            required
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirm-password" required>
          <TextInput
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={event => setConfirm(event.target.value)}
            placeholder="Re-enter your password"
            minLength={6}
            required
          />
        </Field>

        <Button type="submit" loading={loading} block>
          {loading ? 'Updating password...' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
