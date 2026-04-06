import { CalendarDays, CalendarPlus2, FileText, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import MetricCard from '../../components/ui/MetricCard'
import SectionHeader from '../../components/ui/SectionHeader'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { getProfileName, pickFirst } from '../../lib/data'
import { formatDate, formatDateTime } from '../../lib/formatters'
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
    <PageLayout width="wide">
      <div className="space-y-6">
        <Card tone="brand">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="flex h-full flex-col">
              <h2 className="font-display text-4xl font-semibold tracking-tight text-white">
                Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'}
              </h2>
              <div className="mt-auto pt-5">
                <div className="flex flex-wrap gap-3">
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
            <div className="space-y-4">
              {upcomingAppointments.map(appointment => {
                const doctor = pickFirst(appointment.doctor)
                const doctorProfile = pickFirst(doctor?.profiles)

                return (
                  <Card key={appointment.id} interactive className="space-y-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-semibold tracking-tight text-slate-900">
                          Dr. {getProfileName(doctorProfile)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {doctor?.specialization || 'Specialization not available'}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {doctorProfile?.email || 'No email available'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 xl:items-end">
                        <div className="min-w-[10rem] xl:text-right">
                          <p className="text-base font-semibold text-slate-900">
                            {formatDate(appointment.scheduled_at, { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDateTime(appointment.scheduled_at, { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <p className="flex-1 text-sm leading-relaxed text-slate-600">
                        Your appointment is confirmed and ready to open from the detailed visit view.
                      </p>

                      <Button
                        as={Link}
                        to={`/patient/appointments/${appointment.id}`}
                        variant="primary"
                        size="medium"
                        className="w-full shrink-0 sm:w-auto"
                      >
                        View appointment
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : null}
        </section>

      </div>
    </PageLayout>
  )
}
