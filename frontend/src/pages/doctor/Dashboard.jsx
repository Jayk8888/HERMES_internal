import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'

function getAge(dob) {
  if (!dob) return '—'
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function getProfile(profiles) {
  if (!profiles) return {}
  return Array.isArray(profiles) ? profiles[0] : profiles
}

export default function DoctorDashboard() {
  const { user, profile } = useAuth()

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user) return null
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { data: appts, error: err } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        patients (
          dob,
          profiles (full_name, gender)
        )
      `)
      .eq('doctor_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true })

    if (err) throw err
    return appts
  }, [user?.id])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <PageLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Good morning, Dr. {profile?.full_name}</h1>
        <p style={{ color: 'gray', fontSize: 14 }}>{today}</p>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Today's Appointments</h2>
        <Link to="/doctor/appointments" style={{ fontSize: 14, color: '#0369a1', textDecoration: 'none' }}>
          View all →
        </Link>
      </div>

      {!user || loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <div style={{
          padding: '2rem', textAlign: 'center', background: '#f9fafb',
          borderRadius: 10, border: '1px dashed #d1d5db', color: 'gray'
        }}>
          No scheduled appointments for today.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.map(appt => {
            const patientProfile = getProfile(appt.patients?.profiles)
            const dob = appt.patients?.dob
            const age = getAge(dob)
            const gender = patientProfile?.gender
              ? patientProfile.gender.charAt(0).toUpperCase() + patientProfile.gender.slice(1)
              : '—'
            const time = new Date(appt.scheduled_at).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit', hour12: true
            })

            return (
              <div key={appt.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.25rem', borderRadius: 10,
                border: '1px solid #e5e7eb', background: 'white', gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#e0f2fe', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 600, fontSize: 16, color: '#0369a1',
                    flexShrink: 0
                  }}>
                    {patientProfile?.full_name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 2 }}>
                      {patientProfile?.full_name ?? 'Unknown Patient'}
                    </p>
                    <p style={{ fontSize: 13, color: 'gray' }}>
                      {gender} · {age !== '—' ? `${age} yrs` : '—'}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'gray', marginBottom: 2 }}>Time</p>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{time}</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={`/doctor/appointments/${appt.id}`}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: 8, fontSize: 13,
                      background: '#0369a1', color: 'white', textDecoration: 'none', fontWeight: 500
                    }}
                  >
                    View appointment
                  </Link>
                  <Link
                    to={`/doctor/patients/${appt.patients?.id ?? ''}`}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: 8, fontSize: 13,
                      border: '1px solid #e5e7eb', color: '#374151', textDecoration: 'none', fontWeight: 500
                    }}
                  >
                    Patient records
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
