import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthShell from '../../components/layout/AuthShell'
import Button from '../../components/ui/Button'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import TextInput from '../../components/ui/TextInput'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase'

export default function DoctorCompleteProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [specialization, setSpecialization] = useState('')
  const [licenseNo, setLicenseNo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({ id: user.id, specialization, license_no: licenseNo })

      if (doctorError) throw doctorError
      navigate('/')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Doctor setup"
      title="Complete your doctor profile"
      description="Add your clinical credentials so patients can find you and book appointments with confidence."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? <ErrorMessage message={error} /> : null}

        <Field label="Specialization" htmlFor="doctor-specialization" required>
          <TextInput
            id="doctor-specialization"
            value={specialization}
            onChange={event => setSpecialization(event.target.value)}
            placeholder="e.g. Cardiology"
            required
          />
        </Field>

        <Field label="License number" htmlFor="doctor-license" required>
          <TextInput
            id="doctor-license"
            value={licenseNo}
            onChange={event => setLicenseNo(event.target.value)}
            placeholder="e.g. MCI-12345"
            required
          />
        </Field>

        <Button type="submit" loading={loading} block>
          {loading ? 'Completing setup...' : 'Complete setup'}
        </Button>
      </form>
    </AuthShell>
  )
}
