import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'

function formatDate(value) {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function summariseVitals(vitals) {
  if (!vitals || typeof vitals !== 'object') return 'No vitals recorded'

  const entries = Object.entries(vitals).slice(0, 3)
  if (!entries.length) return 'No vitals recorded'

  return entries.map(([key, value]) => `${key}: ${value}`).join(' | ')
}

function pickFirst(value) {
  return Array.isArray(value) ? value[0] : value
}

export default function PatientRecords() {
  const { user, loading: authLoading } = useAuth()

  const { data, loading, error, refetch } = useFetch(() =>
    user
      ? supabase
          .from('medical_records')
          .select(`
            id,
            description,
            prescription,
            vitals,
            created_at,
            appointment:appointments!inner(
              id,
              doctor_id,
              scheduled_at,
              status,
              doctor:doctors!appointments_doctor_id_fkey(
                specialization
              )
            )
          `)
          .order('created_at', { ascending: false })
          .then(async r => {
            if (r.error) throw r.error

            const records = r.data ?? []
            const doctorIds = [
              ...new Set(
                records
                  .map(record => pickFirst(record.appointment)?.doctor_id)
                  .filter(Boolean)
              )
            ]

            if (!doctorIds.length) return records

            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', doctorIds)

            if (profilesError) throw profilesError

            const namesById = Object.fromEntries(
              (profiles ?? []).map(profile => [profile.id, profile.full_name])
            )

            return records.map(record => {
              const appointment = pickFirst(record.appointment)

              return {
                ...record,
                doctorName: namesById[appointment?.doctor_id] ?? null
              }
            })
          })
      : Promise.resolve([])
  , [user?.id])

  if (authLoading) {
    return (
      <PageLayout>
        <h1>Patient Records</h1>
        <LoadingSpinner />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <h1>Patient Records</h1>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}
      {!loading && !error && data?.length === 0 && (
        <p>No medical records are available yet.</p>
      )}
      {!loading && !error && data?.length > 0 && (
        <div style={{ display: 'grid', gap: '1rem', textAlign: 'left' }}>
          {data.map(record => {
            const appointment = pickFirst(record.appointment)
            const doctor = pickFirst(appointment?.doctor)

            return (
              <article
                key={record.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 16,
                  padding: '1rem 1.25rem',
                  background: 'rgba(255,255,255,0.7)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <h2 style={{ marginBottom: 4 }}>
                      {record.doctorName ?? 'Doctor'}
                    </h2>
                    <p style={{ color: '#6b7280' }}>
                      {doctor?.specialization ?? 'Specialization not available'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, color: '#6b7280' }}>Recorded</p>
                    <p>{formatDate(record.created_at)}</p>
                  </div>
                </div>

                <p style={{ marginBottom: '0.75rem', color: '#111827' }}>
                  {record.description}
                </p>

                <div style={{ display: 'grid', gap: '0.35rem', marginBottom: '1rem' }}>
                  <p>
                    <strong>Appointment:</strong> {formatDate(appointment?.scheduled_at)}
                  </p>
                  <p>
                    <strong>Status:</strong> {appointment?.status ?? 'Unknown'}
                  </p>
                  <p>
                    <strong>Prescription:</strong> {record.prescription || 'No prescription recorded'}
                  </p>
                  <p>
                    <strong>Vitals:</strong> {summariseVitals(record.vitals)}
                  </p>
                </div>

                <Link to={`/patient/records/${record.id}`}>View full record</Link>
              </article>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
