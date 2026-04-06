import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthShell from '../../components/layout/AuthShell'
import Button from '../../components/ui/Button'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import TextInput from '../../components/ui/TextInput'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase'

export default function PatientCompleteProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dob, setDob] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: patientError } = await supabase
        .from('patients')
        .insert({ id: user.id, dob })

      if (patientError) throw patientError

      if (phoneNumber.trim()) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone_number: phoneNumber.trim() })
          .eq('id', user.id)

        if (profileError) throw profileError
      }

      navigate('/')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Patient setup"
      title="Complete your patient profile"
      description="We need a few clinical identity details before your dashboard and records become available."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? <ErrorMessage message={error} /> : null}

        <Field label="Date of birth" htmlFor="patient-dob" required>
          <TextInput
            id="patient-dob"
            type="date"
            value={dob}
            onChange={event => setDob(event.target.value)}
            required
          />
        </Field>

        <Field label="Phone number" htmlFor="patient-phone" hint="Optional. Must be a 10-digit number.">
          <TextInput
            id="patient-phone"
            type="text"
            value={phoneNumber}
            onChange={event => setPhoneNumber(event.target.value)}
            inputMode="numeric"
            pattern="[0-9]{10}"
            placeholder="9876543210"
          />
        </Field>

        <Button type="submit" loading={loading} block>
          {loading ? 'Completing setup...' : 'Complete setup'}
        </Button>
      </form>
    </AuthShell>
  )
}
