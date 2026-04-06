import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function DoctorPatients() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch all unique patients for this doctor with non-cancelled appointments
  const { data: patients, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return []

    try {
      // Fetch appointments for this doctor (excluding cancelled)
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          status,
          scheduled_at,
          patients (
            id,
            dob,
            profiles (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('doctor_id', user.id)
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: false })

      if (apptError) throw apptError

      // De-duplicate patients (a patient might have multiple appointments)
      const uniquePatients = {}
      const patientsList = []

      if (appointments && appointments.length > 0) {
        appointments.forEach(appt => {
          const patientId = appt.patient_id
          if (!uniquePatients[patientId]) {
            uniquePatients[patientId] = true
            patientsList.push({
              id: appt.patients.id,
              profile: appt.patients.profiles,
              patient: {
                dob: appt.patients.dob,
              },
              lastAppointment: appt.scheduled_at,
              appointmentStatus: appt.status,
            })
          }
        })
      }

      return patientsList
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch patients')
    }
  }, [user?.id])

  // Filter patients based on search term
  const filteredPatients = patients?.filter(p =>
    p.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 1rem 0' }}>My Patients</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
            Manage all your patients with non-cancelled appointments
          </p>
        </div>

        {error && <ErrorMessage message={error} onRetry={refetch} />}

        {/* Search Bar */}
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
        }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Patients Count */}
        <div style={{
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#6b7280',
        }}>
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
          {searchTerm && ` matching "${searchTerm}"`}
        </div>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px dashed #d1d5db',
          }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
              {patients?.length === 0
                ? 'No patients found. You will see patients here once you have appointments.'
                : 'No patients match your search.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredPatients.map(patient => (
              <Link
                key={patient.id}
                to={`/doctor/patients/${patient.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.borderColor = '#9ca3af'
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Patient Name & Email */}
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#111827', fontWeight: 600 }}>
                    {patient.profile?.full_name || 'Unknown'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                    {patient.profile?.email || '—'}
                  </p>
                </div>

                {/* Age */}
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
                    Age
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#111827' }}>
                    {patient.patient?.dob
                      ? calculateAge(patient.patient.dob)
                      : '—'}
                    {patient.patient?.dob && ' years'}
                  </p>
                </div>

                {/* Last Appointment */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
                      Last Appointment
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827', fontWeight: 500 }}>
                      {new Date(patient.lastAppointment).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.375rem 0.75rem',
                      backgroundColor: getStatusColor(patient.appointmentStatus).bg,
                      color: getStatusColor(patient.appointmentStatus).text,
                      borderRadius: '0.25rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      display: 'inline-block',
                    }}>
                      {patient.appointmentStatus}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

// Helper function to calculate age
function calculateAge(dateOfBirth) {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Helper function to get status colors
function getStatusColor(status) {
  switch (status) {
    case 'completed':
      return { bg: '#dcfce7', text: '#15803d' }
    case 'pending':
      return { bg: '#fef3c7', text: '#92400e' }
    case 'scheduled':
      return { bg: '#dbeafe', text: '#1d4ed8' }
    case 'cancelled':
      return { bg: '#fee2e2', text: '#991b1b' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280' }
  }
}