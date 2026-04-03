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
import { formatDateTime } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

function getProfile(value) {
  if (!value) return {}
  return Array.isArray(value) ? value[0] : value
}

export default function PatientAppointments() {
  const { user } = useAuth()

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return []

    const { data: appointments, error: fetchError } = await supabase
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
    if (fetchError) throw fetchError
    return appointments || []
  }, [user?.id], { key: `patient-appointments:${user?.id ?? 'anonymous'}` })

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <SectionHeader
          title="Appointments"
          description="Review scheduled, completed, and cancelled visits with direct access to each appointment detail."
          actions={(
            <Button as={Link} to="/patient/appointments/book">
              <CalendarPlus2 className="h-4 w-4" />
              Book appointment
            </Button>
          )}
        />

        {loading ? <LoadingSpinner message="Loading appointments..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {loading || error ? null : data.length === 0 ? (
          <EmptyState
            icon="A"
            title="No appointments found"
            description="Appointments will appear here once you start booking visits with your doctors."
          />
        ) : (
          <div className="grid gap-4">
            {data.map(appointment => {
              const doctor = getProfile(appointment.doctor)
              const doctorProfile = getProfile(doctor?.profiles)

              return (
                <Card key={appointment.id} className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr_auto] lg:items-center">
                    <div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {doctorProfile?.full_name ? `Dr. ${doctorProfile.full_name}` : 'Unknown doctor'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {doctor?.specialization || 'Specialization not available'}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-slate-500">
                      <p>{formatDateTime(appointment.scheduled_at)}</p>
                      <StatusBadge status={appointment.status} />
                    </div>

                    <div className="lg:justify-self-end">
                      <Button as={Link} to={`/patient/appointments/${appointment.id}`}>
                        View details
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
