import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function PatientCompleteProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dob, setDob] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: patientError } = await supabase
        .from('patients')
        .insert({ id: user.id, dob })
      if (patientError) throw patientError

      if (phoneNumber) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone_number: phoneNumber })
          .eq('id', user.id)
        if (profileError) throw profileError
      }

      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Complete your profile</h1>
      <p style={{ color: 'gray', marginBottom: '2rem' }}>
        We need a few more details before you can access your dashboard.
      </p>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>⚠ {error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Date of birth</label>
          <input
            type="date"
            value={dob}
            onChange={e => setDob(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label>Phone number <span style={{ color: 'gray', fontWeight: 400 }}>(optional)</span></label>
          <input
            type="text"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            inputMode="numeric"
            pattern="[0-9]{10}"
            placeholder="10-digit number"
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Saving...' : 'Complete setup'}
        </button>
      </form>
    </div>
  )
}
