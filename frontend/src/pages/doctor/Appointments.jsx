import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function DoctorAppointments() {
  const { user } = useAuth()

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return null
    const { data: appts, error: fetchErr } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          profiles (
            full_name,
            email
          )
        )
      `)
      .eq('doctor_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (fetchErr) throw fetchErr
    return appts
  }, [user?.id])

  return (
    <PageLayout>
      <h1>Doctor Appointments</h1>
      {!user || loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {data.map(appt => (
            <div key={appt.id} style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
              <h3>Patient: {Array.isArray(appt.patients?.profiles) ? appt.patients?.profiles[0]?.full_name : appt.patients?.profiles?.full_name || 'Unknown Patient'}</h3>
              <p><strong>Email:</strong> {Array.isArray(appt.patients?.profiles) ? appt.patients?.profiles[0]?.email : appt.patients?.profiles?.email || 'N/A'}</p>
              <p><strong>Date:</strong> {new Date(appt.scheduled_at).toLocaleString()}</p>
              <p><strong>Status:</strong> {appt.status}</p>
              <div style={{ marginTop: '1rem' }}>
                <Link to={`/doctor/appointments/${appt.id}`} style={{ textDecoration: 'none', color: '#0066cc', fontWeight: 'bold' }}>
                  View Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
