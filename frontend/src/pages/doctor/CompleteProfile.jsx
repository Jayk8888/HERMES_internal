import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function DoctorCompleteProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [specialization, setSpecialization] = useState('')
  const [licenseNo, setLicenseNo] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase
        .from('doctors')
        .insert({ id: user.id, specialization, license_no: licenseNo })
      if (error) throw error
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
          <label>Specialization</label>
          <input
            type="text"
            placeholder="e.g. Cardiology, General Practice"
            value={specialization}
            onChange={e => setSpecialization(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label>License number</label>
          <input
            type="text"
            placeholder="e.g. MCI-12345"
            value={licenseNo}
            onChange={e => setLicenseNo(e.target.value)}
            required
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
