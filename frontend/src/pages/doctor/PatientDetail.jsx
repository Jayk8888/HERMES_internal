import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function DoctorPatientDetail() {
  const { patientId } = useParams()
  const { user } = useAuth()

  // Fetch patient profile + patient data + all their medical records
  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user?.id || !patientId) return null

    try {
      // Fetch patient profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') throw profileError

      // Fetch patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (patientError && patientError.code !== 'PGRST116') throw patientError

      // Fetch all medical records through appointments
      // Get records where doctor_id = current user AND patient_id = selected patient
      const { data: recordsData, error: recordsError } = await supabase
        .from('medical_records')
        .select(`
          *,
          appointments (
            id,
            scheduled_at,
            status,
            doctor_id,
            patient_id
          )
        `)
        .in('appointment_id', 
          // First get all appointments for this doctor-patient pair
          await supabase
            .from('appointments')
            .select('id')
            .eq('doctor_id', user.id)
            .eq('patient_id', patientId)
            .then(res => res.data?.map(a => a.id) || [])
        )
        .order('created_at', { ascending: false })

      if (recordsError && recordsError.code !== 'PGRST116') {
        // If records don't exist, just continue with empty array
        console.warn('Note: No records found or error fetching')
      }

      return {
        profile: profileData || {},
        patient: patientData || {},
        records: recordsData || [],
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch patient details')
    }
  }, [user?.id, patientId])

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <Link to="/doctor/patients" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
          ← Back to Patients
        </Link>
        <ErrorMessage message={error} onRetry={refetch} />
      </PageLayout>
    )
  }

  if (!data || !data.profile) {
    return (
      <PageLayout>
        <Link to="/doctor/patients" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
          ← Back to Patients
        </Link>
        <h1>Patient not found</h1>
      </PageLayout>
    )
  }

  const { profile, patient, records } = data

  return (
    <PageLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        <Link to="/doctor/patients" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block', fontWeight: 500 }}>
          ← Back to Patients
        </Link>

        {/* Patient Header Card */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Side - Basic Info */}
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.875rem' }}>{profile.full_name || 'N/A'}</h1>
              <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.95rem' }}>
                Patient ID: <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{patientId}</span>
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
                  Email
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{profile.email || '—'}</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
                  Phone
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{profile.phone_number || '—'}</p>
              </div>

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

            {/* Right Side - Additional Info */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
                  Date of Birth
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  {patient?.dob ? new Date(patient.dob).toLocaleDateString() : '—'}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
                  Medical Records
                </h3>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#3b82f6' }}>
                  {records?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Records Section */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            Medical Records ({records?.length || 0})
          </h2>

          {!records || records.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem',
              border: '1px dashed #d1d5db',
            }}>
              <p style={{ margin: 0, color: '#6b7280' }}>
                No medical records found for this patient.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {records.map(record => (
                <Link
                  key={record.id}
                  to={`/doctor/records/${record.id}`}
                  style={{
                    padding: '1.25rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: '#f9fafb',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                    e.currentTarget.style.borderColor = '#9ca3af'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                    {/* Date */}
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                        Date
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#111827', fontWeight: 500 }}>
                        {new Date(record.created_at).toLocaleDateString()} {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                        Description
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}>
                        {record.description || '—'}
                      </p>
                    </div>

                    {/* Status */}
                    <div style={{ textAlign: 'right' }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                        Appointment Status
                      </h4>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.375rem 0.75rem',
                        backgroundColor: getStatusColor(record.appointments?.status).bg,
                        color: getStatusColor(record.appointments?.status).text,
                        borderRadius: '0.25rem',
                        fontWeight: 600,
                        display: 'inline-block',
                        textTransform: 'capitalize',
                      }}>
                        {record.appointments?.status || '—'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

// Helper function to get status colors
function getStatusColor(status) {
  switch (status) {
    case 'completed':
      return { bg: '#dcfce7', text: '#15803d' }
    case 'pending':
      return { bg: '#fef3c7', text: '#92400e' }
    case 'cancelled':
      return { bg: '#fee2e2', text: '#991b1b' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280' }
  }
}