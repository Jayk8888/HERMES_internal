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
import { useAuth } from '../../hooks/useAuth.jsx'
import { pickFirst } from '../../lib/data'
import { formatDateTime } from '../../lib/formatters'
import { summariseVitals } from '../../lib/medical'
import { supabase } from '../../lib/supabase'

export default function PatientRecords() {
  const { user, loading: authLoading } = useAuth()

  const { data, loading, error, refetch } = useFetch(() =>
    user
      ? supabase
          .from('medical_records')
          .select(`
            id,
            description,
            prescription,
            vitals,
            created_at,
            appointment:appointments!inner(
              id,
              doctor_id,
              scheduled_at,
              status,
              doctor:doctors!appointments_doctor_id_fkey(
                specialization,
                profiles (full_name)
              )
            )
          `)
          .order('created_at', { ascending: false })
          .then(response => {
            if (response.error) throw response.error
            return response.data ?? []
          })
      : Promise.resolve([])
  , [user?.id], { key: `patient-records:${user?.id ?? 'anonymous'}` })

  if (authLoading) {
    return (
      <PageLayout>
        <LoadingSpinner message="Loading your records..." />
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
          title="Medical records"
          description="Review appointment-linked clinical notes, prescriptions, and recorded vitals."
          actions={(
            <Button as={Link} to="/patient/appointments/book">
              <CalendarPlus2 className="h-4 w-4" />
              Book appointment
            </Button>
          )}
        />

        {loading ? <LoadingSpinner message="Loading your records..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {!loading && !error && data?.length === 0 ? (
          <EmptyState
            icon="R"
            title="No medical records yet"
            description="Records will appear here after a doctor completes an appointment and adds clinical notes."
            action={(
              <Button as={Link} to="/patient/appointments">
                View appointments
              </Button>
            )}
          />
        ) : null}

        {!loading && !error && data?.length > 0 ? (
          <Card className="divide-y divide-slate-200/80 overflow-hidden p-0">
            {data.map(record => {
              const appointment = pickFirst(record.appointment)
              const doctor = pickFirst(appointment?.doctor)
              const doctorProfile = pickFirst(doctor?.profiles)

              return (
                <Link
                  key={record.id}
                  to={`/patient/records/${record.id}`}
                  className="block px-5 py-5 no-underline transition-colors hover:bg-slate-50/75 sm:px-6"
                >
                  <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                    <div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        Dr. {doctorProfile?.full_name || 'Doctor'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {doctor?.specialization || 'Specialization not available'}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        {record.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-slate-500">
                      <p>Recorded {formatDateTime(record.created_at)}</p>
                      <p>{summariseVitals(record.vitals)}</p>
                    </div>

                    <div className="lg:justify-self-end">
                      <StatusBadge status={appointment?.status} />
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
