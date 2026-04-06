import { useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function DoctorProfile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Form state - Cleaned up to exactly match DB schema
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    specialization: '',
    licenseNo: '',
  })

  // Fetch both profiles and doctors rows for current user
  const { data: profileData, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return null

    try {
      // Fetch from profiles table
      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') throw profileError

      // Fetch from doctors table
      const { data: doctorRow, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', user.id)
        .single()

      if (doctorError && doctorError.code !== 'PGRST116') throw doctorError

      const combined = {
        profile: profileRow || {},
        doctor: doctorRow || {},
      }

      // Populate form state safely
      setFormData({
        fullName: profileRow?.full_name || '',
        email: user.email || '',
        specialization: doctorRow?.specialization || '',
        licenseNo: doctorRow?.license_no || '',
      })

      return combined
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch profile data')
    }
  }, [user?.id])

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaveError(null)
    setSuccessMessage('')

    try {
      setSaveLoading(true)

      // Validate required fields
      if (!formData.specialization.trim()) {
        throw new Error('Specialization is required')
      }
      if (!formData.licenseNo.trim()) {
        throw new Error('License number is required')
      }

      // Update profiles table
      if (formData.fullName.trim()) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
          })
          .eq('id', user.id)

        if (profileError) throw profileError
      }

      // Update doctors table - STRICTLY matching DB columns
      const { error: doctorError } = await supabase
        .from('doctors')
        .update({
          specialization: formData.specialization,
          license_no: formData.licenseNo,
        })
        .eq('id', user.id)

      if (doctorError) throw doctorError

      setSuccessMessage('Profile updated successfully!')
      setIsEditing(false)
      
      // Refresh data to show changes
      await refetch()
    } catch (err) {
      setSaveError(err.message || 'Failed to save profile')
      console.error('Error saving profile:', err)
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Doctor Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && <ErrorMessage message={error} onRetry={refetch} />}

        {saveError && (
          <div
            style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.375rem',
              border: '1px solid #fecaca',
            }}
          >
            ✗ {saveError}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              borderRadius: '0.375rem',
              border: '1px solid #86efac',
            }}
          >
            ✓ {successMessage}
          </div>
        )}

        {isEditing ? (
          // Edit Mode Form
          <form onSubmit={handleSaveProfile} style={{ backgroundColor: '#f9fafb', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#f3f4f6',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                    color: '#6b7280',
                  }}
                />
              </div>

              {/* Specialization */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                  Specialization *
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="e.g. Cardiology, Neurology"
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* License Number */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                  License Number *
                </label>
                <input
                  type="text"
                  name="licenseNo"
                  value={formData.licenseNo}
                  onChange={handleInputChange}
                  placeholder="e.g. MCI-12345"
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setSaveError(null)
                }}
                disabled={saveLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  opacity: saveLoading ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: saveLoading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : profileData ? (
          // View Mode
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
            {/* Profile Header */}
            <div style={{ padding: '2rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>{formData.fullName || 'N/A'}</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>{formData.email}</p>
            </div>

            {/* Profile Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', padding: '1.5rem' }}>
              {/* Left Column */}
              <div style={{ paddingRight: '1.5rem', borderRight: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
                    Specialization
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#111827' }}>
                    {formData.specialization || '—'}
                  </p>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
                    License Number
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#111827' }}>
                    {formData.licenseNo || '—'}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ paddingLeft: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
                    Account Status
                  </h3>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.375rem 0.75rem',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    borderRadius: '0.25rem',
                    fontWeight: 600,
                    display: 'inline-block',
                  }}>
                    ✓ ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageLayout>
  )
}