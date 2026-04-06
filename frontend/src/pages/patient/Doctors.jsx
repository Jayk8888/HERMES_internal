import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

function formatDateTime(value) {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function groupDoctors(appointments, profiles) {
  const namesById = Object.fromEntries(
    (profiles ?? []).map(profile => [profile.id, profile.full_name])
  )

  const doctorsById = new Map()

  for (const appointment of appointments ?? []) {
    const current = doctorsById.get(appointment.doctor_id)
    const scheduledAt = appointment.scheduled_at

    if (!current) {
      doctorsById.set(appointment.doctor_id, {
        id: appointment.doctor_id,
        full_name: namesById[appointment.doctor_id] ?? 'Doctor',
        specialization: appointment.doctor?.specialization ?? 'Specialization not available',
        license_no: appointment.doctor?.license_no ?? 'Not available',
        appointmentCount: 1,
        lastAppointment: scheduledAt,
        upcomingAppointment:
          appointment.status === 'scheduled' ? scheduledAt : null
      })
      continue
    }

    current.appointmentCount += 1

    if (scheduledAt && (!current.lastAppointment || scheduledAt > current.lastAppointment)) {
      current.lastAppointment = scheduledAt
    }

    if (
      appointment.status === 'scheduled' &&
      scheduledAt &&
      (!current.upcomingAppointment || scheduledAt < current.upcomingAppointment)
    ) {
      current.upcomingAppointment = scheduledAt
    }
  }

  return [...doctorsById.values()].sort((a, b) => {
    if (a.upcomingAppointment && b.upcomingAppointment) {
      return a.upcomingAppointment.localeCompare(b.upcomingAppointment)
    }
    if (a.upcomingAppointment) return -1
    if (b.upcomingAppointment) return 1
    return (b.lastAppointment ?? '').localeCompare(a.lastAppointment ?? '')
  })
}

export default function PatientDoctors() {
  const { user, loading: authLoading } = useAuth()

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return []

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        doctor_id,
        scheduled_at,
        status,
        doctor:doctors!appointments_doctor_id_fkey(
          specialization,
          license_no
        )
      `)
      .eq('patient_id', user.id)
      .order('scheduled_at', { ascending: false })

    if (appointmentsError) throw appointmentsError

    const doctorIds = [...new Set((appointments ?? []).map(item => item.doctor_id).filter(Boolean))]

    if (!doctorIds.length) return []

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', doctorIds)

    if (profilesError) throw profilesError

    return groupDoctors(appointments, profiles)
  }, [user?.id])

  if (authLoading) {
    return (
      <PageLayout>
        <h1>Patient Doctors</h1>
        <LoadingSpinner message="Loading your doctors..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div style={{ display: 'grid', gap: '1.5rem', textAlign: 'left' }}>
        <div>
          <h1 style={{ marginBottom: '0.75rem' }}>Patient Doctors</h1>
          <p>
            Doctors connected to your account through your appointments.
          </p>
        </div>

        {loading && <LoadingSpinner message="Loading your doctors..." />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}

        {!loading && !error && data?.length === 0 && (
          <section
            style={{
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '1.25rem',
              background: 'rgba(255,255,255,0.7)'
            }}
          >
            <h2 style={{ marginBottom: '0.5rem' }}>No doctors yet</h2>
            <p style={{ marginBottom: '1rem' }}>
              You will see doctors here after you book or complete an appointment.
            </p>
            <Link to="/patient/appointments/book">Book an appointment</Link>
          </section>
        )}

        {!loading && !error && data?.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {data.map(doctor => (
              <article
                key={doctor.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '1.25rem',
                  background: 'rgba(255,255,255,0.7)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <h2 style={{ marginBottom: '0.35rem' }}>{doctor.full_name}</h2>
                    <p>{doctor.specialization}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14 }}>Appointments</p>
                    <p style={{ color: 'var(--text-h)', fontSize: 24, fontWeight: 600 }}>
                      {doctor.appointmentCount}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.4rem', marginBottom: '1rem' }}>
                  <p>
                    <strong>License:</strong> {doctor.license_no}
                  </p>
                  <p>
                    <strong>Last appointment:</strong> {formatDateTime(doctor.lastAppointment)}
                  </p>
                  <p>
                    <strong>Next scheduled:</strong> {formatDateTime(doctor.upcomingAppointment)}
                  </p>
                </div>

                <Link to="/patient/appointments/book">Book another appointment</Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
