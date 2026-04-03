import { CalendarDays, CalendarPlus2, FileText, Stethoscope, UserCog } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import MetricCard from '../../components/ui/MetricCard'
import SectionHeader from '../../components/ui/SectionHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { getProfileName, pickFirst } from '../../lib/data'
import { formatDateTime } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

export default function PatientDashboard() {
  const { user, profile, loading: authLoading } = useAuth()

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useFetch(async () => {
    if (!user?.id) {
      return { appointments: 0, doctors: 0, records: 0, lastRecord: null }
    }

    const [appointmentCountRes, doctorRowsRes, recordsRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', user.id),
      supabase
        .from('appointments')
        .select('doctor_id')
        .eq('patient_id', user.id),
      supabase
        .from('medical_records')
        .select(`
          created_at,
          appointment:appointments!inner (
            patient_id
          )
        `, { count: 'exact' })
        .eq('appointment.patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    if (appointmentCountRes.error) throw appointmentCountRes.error
    if (doctorRowsRes.error) throw doctorRowsRes.error
    if (recordsRes.error) throw recordsRes.error

    return {
      appointments: appointmentCountRes.count || 0,
      doctors: new Set((doctorRowsRes.data ?? []).map(row => row.doctor_id)).size,
      records: recordsRes.count || 0,
      lastRecord: recordsRes.data?.[0]?.created_at ?? null,
    }
  }, [user?.id], { key: `patient-dashboard-stats:${user?.id ?? 'anonymous'}` })

  const {
    data: upcomingAppointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useFetch(async () => {
    if (!user?.id) return []

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        doctor:doctor_id (
          id,
          specialization,
          profiles (full_name, email)
        )
      `)
      .eq('patient_id', user.id)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(3)

    if (error) throw error
    return data || []
  }, [user?.id], { key: `patient-dashboard-upcoming:${user?.id ?? 'anonymous'}` })

  if (authLoading) {
    return (
      <PageLayout>
        <LoadingSpinner message="Loading your workspace..." />
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
        <Card tone="brand">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <h2 className="font-display text-4xl font-semibold tracking-tight text-white">
                Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'}
              </h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button as={Link} to="/patient/appointments/book" className="bg-white text-primary-800 hover:bg-primary-50">
                  <CalendarPlus2 className="h-4 w-4" />
                  Book appointment
                </Button>
                <Button as={Link} to="/patient/records" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                  <FileText className="h-4 w-4" />
                  View records
                </Button>
              </div>
            </div>

            <div className="grid content-start gap-4 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-50/65">
                  Care snapshot
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <p className="text-sm text-primary-50/70">Connected doctors</p>
                  <p className="font-display text-3xl font-semibold text-white">
                    {statsLoading ? '—' : stats?.doctors ?? 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-primary-50/70">Latest record</p>
                  <p className="text-sm font-semibold text-white">
                    {stats?.lastRecord ? formatDateTime(stats.lastRecord) : 'No records yet'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {statsError ? <ErrorMessage message={statsError} onRetry={refetchStats} /> : null}

        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard
            label="Total appointments"
            value={statsLoading ? '—' : stats?.appointments ?? 0}
            meta="Scheduled, completed, and cancelled visits."
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <MetricCard
            label="Connected doctors"
            value={statsLoading ? '—' : stats?.doctors ?? 0}
            meta="Doctors associated with your appointment history."
            icon={<Stethoscope className="h-5 w-5" />}
          />
          <MetricCard
            label="Medical records"
            value={statsLoading ? '—' : stats?.records ?? 0}
            meta="Clinical notes and prescriptions attached to appointments."
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        <section className="space-y-4">
          <SectionHeader
            eyebrow="Upcoming care"
            title="Scheduled appointments"
            description="Your next confirmed visits appear here with direct access to the appointment detail view."
            actions={(
              <Button as={Link} to="/patient/appointments" variant="secondary">
                View all appointments
              </Button>
            )}
          />

          {appointmentsLoading ? <LoadingSpinner message="Loading upcoming appointments..." /> : null}
          {appointmentsError ? <ErrorMessage message={appointmentsError} onRetry={refetchAppointments} /> : null}

          {!appointmentsLoading && !appointmentsError && upcomingAppointments?.length === 0 ? (
            <EmptyState
              icon="A"
              title="No upcoming appointments"
              description="When you schedule a visit, it will appear here with doctor details and confirmed timing."
              action={(
                <Button as={Link} to="/patient/appointments/book">
                  Book your first appointment
                </Button>
              )}
            />
          ) : null}

          {!appointmentsLoading && !appointmentsError && upcomingAppointments?.length > 0 ? (
            <Card className="divide-y divide-slate-200/80 overflow-hidden p-0">
              {upcomingAppointments.map(appointment => {
                const doctor = pickFirst(appointment.doctor)
                const doctorProfile = pickFirst(doctor?.profiles)

                return (
                  <Link
                    key={appointment.id}
                    to={`/patient/appointments/${appointment.id}`}
                    className="block px-5 py-5 no-underline transition-colors hover:bg-slate-50/75 sm:px-6"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                          Scheduled visit
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">
                          Dr. {getProfileName(doctorProfile)}
                        </h3>
                        <div className="mt-2 space-y-1 text-sm text-slate-500">
                          <p>{doctor?.specialization || 'Specialization not available'}</p>
                          <p>{formatDateTime(appointment.scheduled_at)}</p>
                          <p>{doctorProfile?.email || 'No email available'}</p>
                        </div>
                      </div>
                      <StatusBadge status={appointment.status} />
                    </div>
                  </Link>
                )
              })}
            </Card>
          ) : null}
        </section>

        <section className="space-y-4">
          <SectionHeader
            eyebrow="Quick actions"
            title="Move quickly"
            description="Jump directly into the workflows patients use most often."
          />

          <Card tone="subtle" className="grid divide-y divide-slate-200/80 overflow-hidden p-0 md:grid-cols-3 md:divide-x md:divide-y-0">
            <Link to="/patient/appointments/book" className="block px-5 py-5 no-underline transition-colors hover:bg-white/70 sm:px-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-100 bg-white/80 text-primary-700">
                <CalendarPlus2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Book a new appointment</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Browse doctors, inspect availability, and schedule a visit in a guided flow.
              </p>
            </Link>

            <Link to="/patient/doctors" className="block px-5 py-5 no-underline transition-colors hover:bg-white/70 sm:px-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-100 bg-white/80 text-primary-700">
                <Stethoscope className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Review connected doctors</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                See the doctors tied to your existing and past appointments.
              </p>
            </Link>

            <Link to="/patient/profile" className="block px-5 py-5 no-underline transition-colors hover:bg-white/70 sm:px-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-100 bg-white/80 text-primary-700">
                <UserCog className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Update your profile</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Keep your personal information and clinical identity details current.
              </p>
            </Link>
          </Card>
        </section>
      </div>
    </PageLayout>
  )
}
