import { CalendarPlus2, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import SectionHeader from '../../components/ui/SectionHeader'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

function groupDoctors(appointments = []) {
  const doctorsById = new Map()

  for (const appointment of appointments) {
    const current = doctorsById.get(appointment.doctor_id)
    const doctor = Array.isArray(appointment.doctor) ? appointment.doctor[0] : appointment.doctor
    const profile = Array.isArray(doctor?.profiles) ? doctor.profiles[0] : doctor?.profiles
    const scheduledAt = appointment.scheduled_at

    if (!current) {
      doctorsById.set(appointment.doctor_id, {
        id: appointment.doctor_id,
        fullName: profile?.full_name ?? 'Doctor',
        specialization: doctor?.specialization ?? 'Specialization not available',
        licenseNo: doctor?.license_no ?? 'Not available',
        appointmentCount: 1,
        lastAppointment: scheduledAt,
        upcomingAppointment: appointment.status === 'scheduled' ? scheduledAt : null,
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

  return [...doctorsById.values()].sort((first, second) => {
    if (first.upcomingAppointment && second.upcomingAppointment) {
      return first.upcomingAppointment.localeCompare(second.upcomingAppointment)
    }
    if (first.upcomingAppointment) return -1
    if (second.upcomingAppointment) return 1
    return (second.lastAppointment ?? '').localeCompare(first.lastAppointment ?? '')
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
          license_no,
          profiles (full_name)
        )
      `)
      .eq('patient_id', user.id)
      .order('scheduled_at', { ascending: false })

    if (appointmentsError) throw appointmentsError
    return groupDoctors(appointments)
  }, [user?.id], { key: `patient-doctors:${user?.id ?? 'anonymous'}` })

  if (authLoading) {
    return (
      <PageLayout>
        <LoadingSpinner message="Loading your doctors..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      width="wide"
      actions={(
        <Button as={Link} to="/patient/appointments/book">
          <CalendarPlus2 className="h-4 w-4" />
          Book appointment
        </Button>
      )}
    >
      <div className="space-y-6">
        <SectionHeader
          title="Connected doctors"
          description="Doctors appear here after you book or complete appointments with them."
          actions={(
            <Button as={Link} to="/patient/appointments/book">
              <CalendarPlus2 className="h-4 w-4" />
              Book appointment
            </Button>
          )}
        />

        {loading ? <LoadingSpinner message="Loading your doctors..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {!loading && !error && data?.length === 0 ? (
          <EmptyState
            icon={<Stethoscope className="h-5 w-5" />}
            title="No doctors connected yet"
            description="Once you book an appointment, your doctors will appear here with their visit history."
            action={(
              <Button as={Link} to="/patient/appointments/book">
                Book an appointment
              </Button>
            )}
          />
        ) : null}

        {!loading && !error && data?.length > 0 ? (
          <Card className="divide-y divide-slate-200/80 overflow-hidden p-0">
            {data.map(doctor => (
              <div key={doctor.id} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[1.3fr_0.8fr_0.9fr] lg:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Doctor
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    Dr. {doctor.fullName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{doctor.specialization}</p>
                </div>

                <div className="space-y-3 text-sm text-slate-500">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Visits
                    </p>
                    <p className="mt-1 font-display text-3xl font-semibold text-slate-900">
                      {doctor.appointmentCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      License
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{doctor.licenseNo}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-500">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Last visit
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDateTime(doctor.lastAppointment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Next scheduled
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDateTime(doctor.upcomingAppointment)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        ) : null}
      </div>
    </PageLayout>
  )
}
