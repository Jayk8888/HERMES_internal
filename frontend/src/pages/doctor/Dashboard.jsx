import { CalendarDays, ClipboardList, UserRound } from 'lucide-react'
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
import { getAge } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

function getProfile(value) {
  if (!value) return {}
  return Array.isArray(value) ? value[0] : value
}

export default function DoctorDashboard() {
  const { user, profile } = useAuth()

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return []

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        patients (
          id,
          dob,
          profiles (full_name, gender)
        )
      `)
      .eq('doctor_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true })

    if (fetchError) throw fetchError
    return appointments || []
  }, [user?.id], { key: `doctor-dashboard:${user?.id ?? 'anonymous'}` })

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <PageLayout
      width="wide"
      actions={(
        <Button as={Link} to="/doctor/availability">
          <CalendarDays className="h-4 w-4" />
          Manage availability
        </Button>
      )}
    >
      <div className="space-y-6">
        <Card tone="brand">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-50/70">
                Today
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white">
                Good morning, Dr. {profile?.full_name ?? 'Doctor'}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-primary-50/80">
                Stay focused on today’s confirmed visits, open each appointment quickly, and jump into patient history when needed.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-50/70">
                Daily overview
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{today}</p>
              <p className="mt-4 text-sm leading-relaxed text-primary-50/70">
                Scheduled appointments for today: <span className="font-semibold text-white">{data?.length ?? 0}</span>
              </p>
            </div>
          </div>
        </Card>

        <SectionHeader
          eyebrow="Today’s schedule"
          title="Confirmed appointments"
          description="Appointments are shown in chronological order so you can move through the day’s clinical work without losing context."
          actions={(
            <Button as={Link} to="/doctor/appointments" variant="secondary">
              <ClipboardList className="h-4 w-4" />
              View all appointments
            </Button>
          )}
        />

        {loading ? <LoadingSpinner message="Loading today's appointments..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {loading || error ? null : data.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="No scheduled appointments for today"
            description="When patients book into an available slot, today’s confirmed appointments will appear here."
            action={(
              <Button as={Link} to="/doctor/availability">
                Manage availability
              </Button>
            )}
          />
        ) : (
          <div className="grid gap-4">
            {data.map(appointment => {
              const patient = getProfile(appointment.patients)
              const patientProfile = getProfile(patient?.profiles)
              const age = getAge(patient?.dob)
              const appointmentTime = new Date(appointment.scheduled_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })

              return (
                <Card key={appointment.id}>
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.7fr_auto] lg:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {patientProfile?.full_name ?? 'Unknown patient'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {(patientProfile?.gender ? `${patientProfile.gender} • ` : '') + (age !== null ? `${age} yrs` : 'Age not available')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-slate-500">
                      <p className="font-semibold text-slate-900">{appointmentTime}</p>
                      <p>Scheduled today</p>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <Button as={Link} to={`/doctor/appointments/${appointment.id}`}>
                        View appointment
                      </Button>
                      <Button as={Link} to={`/doctor/patients/${patient?.id ?? ''}`} variant="secondary">
                        Patient history
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
