import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Card from '../../components/ui/Card'
import ErrorMessage from '../../components/ui/ErrorMessage'
import InfoList from '../../components/ui/InfoList'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { pickFirst } from '../../lib/data'
import { formatDate, formatDateTime } from '../../lib/formatters'
import { VITAL_LABELS } from '../../lib/medical'
import { supabase } from '../../lib/supabase'

export default function PatientRecordDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const { data, loading, error, refetch } = useFetch(() =>
    supabase
      .from('medical_records')
      .select(`
        id,
        description,
        prescription,
        vitals,
        created_at,
        appointment:appointment_id (
          scheduled_at,
          doctor:doctor_id (
            specialization,
            profiles (full_name)
          )
        )
      `)
      .eq('id', id)
      .single()
      .then(response => {
        if (response.error) throw response.error
        return response.data
      })
  , [id, user?.id], { key: `patient-record-detail:${user?.id ?? 'anonymous'}:${id ?? 'unknown'}` })

  const doctor = pickFirst(data?.appointment?.doctor)
  const doctorProfile = pickFirst(doctor?.profiles)

  return (
    <PageLayout width="narrow">
      <div className="space-y-5">
        <Link
          to="/patient/records"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 no-underline hover:text-primary-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to records
        </Link>

        {loading ? <LoadingSpinner message="Loading medical record..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {data ? (
          <>
            <Card tone="brand">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-50/70">
                Medical record
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
                {formatDate(data.created_at)}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-primary-50/80">
                Detailed clinical notes, prescriptions, and recorded vitals for this appointment.
              </p>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Record summary</h3>
              <InfoList
                items={[
                  { label: 'Doctor', value: `Dr. ${doctorProfile?.full_name || 'Unknown'}` },
                  { label: 'Specialization', value: doctor?.specialization || 'Not available' },
                  { label: 'Appointment date', value: formatDateTime(data.appointment?.scheduled_at) },
                  { label: 'Record created', value: formatDateTime(data.created_at) },
                ]}
              />
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Description</h3>
              <p className="text-sm leading-relaxed text-slate-700">{data.description}</p>
            </Card>

            {data.prescription ? (
              <Card className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Prescription</h3>
                <p className="text-sm leading-relaxed text-slate-700">{data.prescription}</p>
              </Card>
            ) : null}

            {data.vitals && Object.keys(data.vitals).length > 0 ? (
              <Card className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Vitals</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(data.vitals).map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                        {VITAL_LABELS[key] ?? key}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </PageLayout>
  )
}
