import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ErrorMessage from '../../components/ui/ErrorMessage'
import InfoList from '../../components/ui/InfoList'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { getProfileName, pickFirst } from '../../lib/data'
import { formatDateTime } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

export default function PatientAppointmentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

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
          license_no,
          profiles (full_name, email)
        )
      `)
      .eq('id', id)
      .single()
      .then(response => {
        if (response.error) throw response.error
        return response.data
      })
  , [id, user?.id], { key: `patient-appointment-detail:${user?.id ?? 'anonymous'}:${id ?? 'unknown'}` })

  async function handleCancel() {
    setCancelError('')
    setCancelling(true)

    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (updateError) throw updateError
      await refetch()
    } catch (requestError) {
      setCancelError(requestError.message)
    } finally {
      setCancelling(false)
    }
  }

  const doctor = pickFirst(data?.doctor)
  const doctorProfile = pickFirst(doctor?.profiles)

  return (
    <PageLayout width="narrow">
      <div className="space-y-5">
        <Link
          to="/patient/appointments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 no-underline hover:text-primary-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to appointments
        </Link>

        {loading ? <LoadingSpinner message="Loading appointment details..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {data ? (
          <>
            <Card tone="brand">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-50/70">
                    Appointment detail
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
                    {formatDateTime(data.scheduled_at)}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-primary-50/80">
                    Review the doctor, schedule, and current status for this visit.
                  </p>
                </div>
                <StatusBadge status={data.status} />
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Doctor information
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Dr. {getProfileName(doctorProfile)}
                </h3>
              </div>
              <InfoList
                items={[
                  { label: 'Specialization', value: doctor?.specialization || 'Not available' },
                  { label: 'License number', value: doctor?.license_no || 'Not available' },
                  { label: 'Email', value: doctorProfile?.email || 'Not available' },
                  { label: 'Scheduled for', value: formatDateTime(data.scheduled_at) },
                ]}
              />
            </Card>

            {cancelError ? <ErrorMessage message={cancelError} /> : null}

            {data.status === 'scheduled' ? (
              <div className="flex justify-end">
                <Button variant="danger" onClick={handleCancel} loading={cancelling}>
                  {cancelling ? 'Cancelling...' : 'Cancel appointment'}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </PageLayout>
  )
}
