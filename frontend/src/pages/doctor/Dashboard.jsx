import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function DoctorDashboard() {
  const { user } = useAuth()

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user) return null
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { data: appts, error: err } = await supabase
      .from('appointments')
      .select('*, patients(profiles(full_name))')
      .eq('doctor_id', user.id)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())

    if (err) throw err
    return appts
  }, [user?.id])

  return (
    <PageLayout>
      <h1 style={{ marginBottom: '1rem' }}>Doctor Dashboard</h1>
      {!user || loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={refetch} /> : (
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>Today's Appointments</h3>
          {!data || data.length === 0 ? (
            <p>No appointments today.</p>
          ) : (
            <ul>
              {data.map(a => (
                <li key={a.id}>
                  <strong>{new Date(a.scheduled_at).toLocaleTimeString()}:</strong> {a.patients?.profiles?.full_name} ({a.status})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </PageLayout>
  )
}
