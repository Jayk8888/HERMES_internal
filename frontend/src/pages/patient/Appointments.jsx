import { CalendarPlus2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import SectionHeader from '../../components/ui/SectionHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { getProfileName, pickFirst } from '../../lib/data'
import { formatDateTime } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

export default function PatientAppointments() {
  const { user } = useAuth()

  const { data, loading, error, refetch } = useFetch(() =>
    supabase
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
      .order('scheduled_at', { ascending: false })
      .then(response => {
        if (response.error) throw response.error
        return response.data
      })
  , [user?.id], { key: `patient-appointments:${user?.id ?? 'anonymous'}` })

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
          title="My appointments"
          description="Review scheduled, completed, and cancelled visits with direct access to each detail page."
          actions={(
            <Button as={Link} to="/patient/appointments/book">
              <CalendarPlus2 className="h-4 w-4" />
              Book appointment
            </Button>
          )}
        />

        {loading ? <LoadingSpinner message="Loading appointments..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {!loading && !error && data?.length === 0 ? (
          <EmptyState
            icon="A"
            title="No appointments yet"
            description="Once you book a visit, you will see the full appointment timeline here."
            action={(
              <Button as={Link} to="/patient/appointments/book">
                Book an appointment
              </Button>
            )}
          />
        ) : null}

        {!loading && !error && data?.length > 0 ? (
          <Card className="divide-y divide-slate-200/80 overflow-hidden p-0">
            {data.map(appointment => {
              const doctor = pickFirst(appointment.doctor)
              const doctorProfile = pickFirst(doctor?.profiles)

              return (
                <Link
                  key={appointment.id}
                  to={`/patient/appointments/${appointment.id}`}
                  className="block px-5 py-5 no-underline transition-colors hover:bg-slate-50/75 sm:px-6"
                >
                  <div className="grid gap-4 md:grid-cols-[1.4fr_0.9fr_auto] md:items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Dr. {getProfileName(doctorProfile)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {doctor?.specialization || 'Specialization not available'}
                      </p>
                    </div>

                    <div className="space-y-1 text-sm text-slate-500">
                      <p>{formatDateTime(appointment.scheduled_at)}</p>
                      <p>{doctorProfile?.email || 'No email available'}</p>
                    </div>

                    <div className="md:justify-self-end">
                      <StatusBadge status={appointment.status} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </Card>
        ) : null}
      </div>
    </PageLayout>
  )
}
