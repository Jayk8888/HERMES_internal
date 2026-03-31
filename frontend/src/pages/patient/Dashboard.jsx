import { Link, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

function statusColor(status) {
  if (status === 'scheduled') return { background: '#e0f2fe', color: '#0369a1' }
  if (status === 'completed') return { background: '#dcfce7', color: '#15803d' }
  if (status === 'cancelled') return { background: '#fee2e2', color: '#b91c1c' }
}

export default function PatientDashboard() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const { data: stats, loading: statsLoading, error: statsError } = useFetch(async () => {
    if (!user?.id) return { appointments: 0, doctors: 0, records: 0, lastRecord: null }

    try {
      const [appointmentsRes, appointmentCountRes, recordsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id')
          .eq('patient_id', user.id)
          .order('scheduled_at', { ascending: false })
          .limit(1),
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('patient_id', user.id),
        supabase
          .from('medical_records')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
      ])

      if (appointmentCountRes.error) throw appointmentCountRes.error
      if (recordsRes.error) throw recordsRes.error

      const appointmentCount = appointmentCountRes.count || 0
      const lastRecord = (recordsRes.data?.[0]?.created_at) || null

      // Get unique doctor count
      const { data: allAppointments, error: allError } = await supabase
        .from('appointments')
        .select('doctor_id')
        .eq('patient_id', user.id)

      if (allError) throw allError

      const uniqueDoctors = new Set((allAppointments || []).map(a => a.doctor_id)).size

      return {
        appointments: appointmentCount,
        doctors: uniqueDoctors,
        records: recordsRes.count || 0,
        lastRecord
      }
    } catch (error) {
      throw error
    }
  }, [user?.id])

  const { data: upcomingAppointments, loading: appointmentsLoading, error: appointmentsError } = useFetch(async () => {
    if (!user?.id) return []

    const { data, error } = await supabase
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
      .eq('patient_id', user.id)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(3)

    if (error) throw error
    return data || []
  }, [user?.id])

  if (authLoading) {
    return (
      <PageLayout>
        <h1>Dashboard</h1>
        <LoadingSpinner />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div style={{ display: 'grid', gap: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Welcome back!</h1>
          <p style={{ color: 'gray' }}>Here's your health dashboard</p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            padding: '1.5rem',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
          }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: '0.5rem' }}>Total Appointments</p>
            <p style={{ fontSize: 28, fontWeight: 600, color: '#0369a1' }}>
              {statsLoading ? '-' : stats?.appointments || 0}
            </p>
          </div>

          <div style={{
            padding: '1.5rem',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)'
          }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: '0.5rem' }}>Connected Doctors</p>
            <p style={{ fontSize: 28, fontWeight: 600, color: '#0369a1' }}>
              {statsLoading ? '-' : stats?.doctors || 0}
            </p>
          </div>

          <div style={{
            padding: '1.5rem',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
          }}>
            <p style={{ fontSize: 12, color: '#666', marginBottom: '0.5rem' }}>Medical Records</p>
            <p style={{ fontSize: 28, fontWeight: 600, color: '#15803d' }}>
              {statsLoading ? '-' : stats?.records || 0}
            </p>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Upcoming Appointments</h2>
            <Link to="/patient/appointments" style={{ fontSize: 14, color: '#0369a1', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {appointmentsLoading && <LoadingSpinner />}
          {appointmentsError && (
            <ErrorMessage message={appointmentsError} onRetry={() => window.location.reload()} />
          )}

          {!appointmentsLoading && !appointmentsError && upcomingAppointments?.length === 0 && (
            <div style={{
              padding: '2rem',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              textAlign: 'center',
              background: '#f9fafb'
            }}>
              <p style={{ color: 'gray', marginBottom: '1rem' }}>No upcoming appointments</p>
              <button
                onClick={() => navigate('/patient/appointments/book')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  border: 'none',
                  background: '#0369a1',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Book an appointment
              </button>
            </div>
          )}

          {!appointmentsLoading && !appointmentsError && upcomingAppointments?.length > 0 && (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {upcomingAppointments.map(appt => (
                <div
                  key={appt.id}
                  onClick={() => navigate(`/patient/appointments/${appt.id}`)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'white',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
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
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={() => navigate('/patient/appointments/book')}
              style={{
                padding: '1rem',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>📅 Book Appointment</p>
              <p style={{ fontSize: 14, color: 'gray' }}>Schedule a new appointment with a doctor</p>
            </button>

            <button
              onClick={() => navigate('/patient/appointments')}
              style={{
                padding: '1rem',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>📋 View Appointments</p>
              <p style={{ fontSize: 14, color: 'gray' }}>Check all your appointments</p>
            </button>

            <button
              onClick={() => navigate('/patient/records')}
              style={{
                padding: '1rem',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>📄 Medical Records</p>
              <p style={{ fontSize: 14, color: 'gray' }}>View your medical records</p>
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
