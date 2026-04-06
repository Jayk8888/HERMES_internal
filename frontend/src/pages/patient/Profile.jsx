import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

const cardStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  boxShadow: 'var(--shadow)',
  padding: '1.5rem',
  textAlign: 'left'
}

const labelStyle = {
  display: 'grid',
  gap: '0.5rem',
  fontSize: 14,
  color: 'var(--text-h)',
  fontWeight: 500
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: '2px solid #9ca3af',
  borderRadius: 10,
  padding: '0.85rem 0.95rem',
  fontSize: 15,
  color: 'var(--text-h)',
  background: 'var(--bg)'
}

function formatDate(value) {
  if (!value) return 'Not provided'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function PatientProfile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    gender: 'male',
    dob: '',
    address: ''
  })
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return null

    const [profileResponse, patientResponse] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, phone_number, gender')
        .eq('id', user.id)
        .single(),
      supabase
        .from('patients')
        .select('dob, address')
        .eq('id', user.id)
        .maybeSingle()
    ])

    if (profileResponse.error) throw profileResponse.error
    if (patientResponse.error) throw patientResponse.error

    return {
      profile: profileResponse.data,
      patient: patientResponse.data
    }
  }, [user?.id])

  useEffect(() => {
    if (!data?.profile) return
    setForm({
      full_name: data.profile.full_name ?? '',
      phone_number: data.profile.phone_number ?? '',
      gender: data.profile.gender ?? 'male',
      dob: data.patient?.dob ?? '',
      address: data.patient?.address ?? ''
    })
  }, [data])

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user?.id || !data?.profile) return

    setSaving(true)
    setSaveError('')
    setSaveMessage('')

    try {
      const trimmedName = form.full_name.trim()
      if (!trimmedName) throw new Error('Full name is required.')

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName,
          phone_number: form.phone_number.trim() || null,
          gender: form.gender
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      if (data.patient) {
        const { error: patientError } = await supabase
          .from('patients')
          .update({
            dob: form.dob || data.patient.dob,
            address: form.address.trim() || null
          })
          .eq('id', user.id)

        if (patientError) throw patientError
      }

      setSaveMessage(
        data.patient
          ? 'Profile updated successfully.'
          : 'Basic profile updated. Date of birth and address are unavailable because no patient record exists yet.'
      )
      await refetch()
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ marginBottom: '0.75rem' }}>Patient Profile</h1>
          <p>Review your account details and keep your personal information current.</p>
        </div>

        {loading && <LoadingSpinner message="Loading your profile..." />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}

        {data?.profile && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <section style={{
              ...cardStyle,
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
            }}>
              <div>
                <p style={{ fontSize: 13, marginBottom: 6 }}>Account role</p>
                <h2 style={{ marginBottom: 0, textTransform: 'capitalize' }}>
                  {data.profile.role}
                </h2>
              </div>
              <div>
                <p style={{ fontSize: 13, marginBottom: 6 }}>Registered email</p>
                <p style={{ color: 'var(--text-h)', fontSize: 18 }}>
                  {data.profile.email}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 13, marginBottom: 6 }}>Gender</p>
                <p style={{ color: 'var(--text-h)', fontSize: 18, textTransform: 'capitalize' }}>
                  {data.profile.gender ?? 'Not provided'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 13, marginBottom: 6 }}>Date of birth</p>
                <p style={{ color: 'var(--text-h)', fontSize: 18 }}>
                  {formatDate(data.patient?.dob)}
                </p>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{
                marginBottom: '1.25rem',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div>
                  <h2 style={{ marginBottom: '0.4rem' }}>Edit details</h2>
                  <p style={{ fontSize: 14 }}>
                    Email and role are managed separately. You can update your name,
                    phone number, gender, date of birth, and address here.
                  </p>
                </div>
              </div>

              <form
                id="patient-profile-form"
                onSubmit={handleSubmit}
                style={{
                  display: 'grid',
                  gap: '0.85rem',
                  border: '1px solid #9ca3af',
                  borderRadius: 14,
                  padding: '1rem'
                }}
              >
                <label style={labelStyle}>
                  Full name
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Enter your full name"
                    required
                  />
                </label>

                <label style={labelStyle}>
                  Phone number
                  <input
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="10-digit number"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </label>

                <div style={labelStyle}>
                  Gender
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {['male', 'female', 'other'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, gender: g }))}
                        style={{
                          flex: 1,
                          padding: '0.7rem',
                          border: form.gender === g ? '2px solid #0e7fa8' : '2px solid #9ca3af',
                          borderRadius: 10,
                          background: form.gender === g ? '#e0f4fa' : 'var(--bg)',
                          color: form.gender === g ? '#0e7fa8' : 'var(--text-h)',
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontSize: 14,
                          textTransform: 'capitalize'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <label style={labelStyle}>
                  Date of birth
                  <input
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                    style={inputStyle}
                    disabled={!data.patient}
                  />
                </label>

                <label style={labelStyle}>
                  Address
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                    placeholder="Your home address (optional)"
                    disabled={!data.patient}
                  />
                </label>

                {!data.patient && (
                  <p style={{ fontSize: 14, color: '#b45309', textAlign: 'left' }}>
                    Your patient record is missing, so date of birth and address cannot
                    be edited from this screen yet.
                  </p>
                )}

                {saveError && <ErrorMessage message={saveError} />}

                {saveMessage && (
                  <div style={{
                    padding: '0.9rem 1rem',
                    borderRadius: 10,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#047857',
                    fontSize: 14
                  }}>
                    {saveMessage}
                  </div>
                )}
              </form>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="submit"
                  form="patient-profile-form"
                  disabled={saving}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '0.85rem 1.25rem',
                    background: '#6d28d9',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    minWidth: 140,
                    boxShadow: '0 8px 18px rgba(109, 40, 217, 0.2)'
                  }}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
