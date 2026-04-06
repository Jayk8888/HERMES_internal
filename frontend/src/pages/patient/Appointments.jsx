import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'

function statusColor(status) {
  if (status === 'scheduled') return { background: '#e0f2fe', color: '#0369a1' }
  if (status === 'completed') return { background: '#dcfce7', color: '#15803d' }
  if (status === 'cancelled') return { background: '#fee2e2', color: '#b91c1c' }
}

export default function PatientAppointments() {
  const navigate = useNavigate()

  const { data, loading, error, refetch } = useFetch(() =>
    supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        doctor:doctor_id (
          id,
          profiles (full_name, email)
        )
      `)
      .order('scheduled_at', { ascending: false })
      .then(r => {
        if (r.error) throw r.error
        return r.data
      })
  )

  return (
    <PageLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>My Appointments</h1>
        <button onClick={() => navigate('/patient/appointments/book')}>
          + Book appointment
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {data && data.length === 0 && (
        <p style={{ color: 'gray' }}>No appointments yet. Book one to get started.</p>
      )}

      {data && data.map(appt => (
        <div
          key={appt.id}
          onClick={() => navigate(`/patient/appointments/${appt.id}`)}
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            marginBottom: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'white'
          }}
        >
          <div>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>
              Dr. {appt.doctor?.profiles?.full_name ?? 'Unknown'}
            </p>
            <p style={{ fontSize: 14, color: 'gray' }}>
              {new Date(appt.scheduled_at).toLocaleString()}
            </p>
          </div>
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            padding: '4px 10px',
            borderRadius: 20,
            textTransform: 'capitalize',
            ...statusColor(appt.status)
          }}>
            {appt.status}
          </span>
        </div>
      ))}
    </PageLayout>
  )
}
