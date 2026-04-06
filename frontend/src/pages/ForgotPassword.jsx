import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/layout/AuthShell'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'
import Field from '../components/ui/Field'
import InlineAlert from '../components/ui/InlineAlert'
import TextInput from '../components/ui/TextInput'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError
      setSent(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Recovery"
      title={sent ? 'Check your email' : 'Reset your password'}
      description={sent
        ? `We sent a password reset link to ${email}.`
        : 'Enter the email tied to your account and we will send a secure reset link.'}
      footer={(
        <>
          Remembered it?{' '}
          <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/login">
            Back to sign in
          </Link>
        </>
      )}
    >
      {sent ? (
        <InlineAlert
          tone="success"
          title="Password reset email sent"
          message="Open the link in your inbox to choose a new password."
        />
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? <ErrorMessage message={error} /> : null}

          <Field label="Email address" htmlFor="forgot-email" required>
            <TextInput
              id="forgot-email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </Field>

          <Button type="submit" loading={loading} block>
            {loading ? 'Sending reset link...' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
