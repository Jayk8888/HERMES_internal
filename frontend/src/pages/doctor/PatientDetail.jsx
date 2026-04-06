import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Card from '../../components/ui/Card'
import DataPairs from '../../components/ui/DataPairs'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function DoctorPatientDetail() {
  const { id: patientId } = useParams()
  const { user } = useAuth()

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user?.id || !patientId) return null

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') throw profileError

    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (patientError && patientError.code !== 'PGRST116') throw patientError

    const { data: appointmentRows, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', user.id)
      .eq('patient_id', patientId)

    if (appointmentsError) throw appointmentsError

    const appointmentIds = appointmentRows?.map(appointment => appointment.id) ?? []

    if (!appointmentIds.length) {
      return {
        profile: profileData || {},
        patient: patientData || {},
        records: [],
      }
    }

    const { data: recordsData, error: recordsError } = await supabase
      .from('medical_records')
      .select(`
        id,
        description,
        created_at,
        appointments (
          id,
          scheduled_at,
          status
        )
      `)
      .in('appointment_id', appointmentIds)
      .order('created_at', { ascending: false })

    if (recordsError && recordsError.code !== 'PGRST116') throw recordsError

    return {
      profile: profileData || {},
      patient: patientData || {},
      records: recordsData || [],
    }
  }, [user?.id, patientId], { key: `doctor-patient-detail:${user?.id ?? 'anonymous'}:${patientId ?? 'unknown'}` })

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner message="Loading patient details..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout width="wide">
      <div className="space-y-5">
        <Link
          to="/doctor/patients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 no-underline hover:text-primary-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to patients
        </Link>

        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {!error && !data?.profile ? (
          <Card>
            <p className="text-sm text-slate-500">Patient not found.</p>
          </Card>
        ) : null}

        {data?.profile ? (
          <>
            <Card tone="brand">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-50/70">
                    Patient detail
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white">
                    {data.profile.full_name || 'Unknown patient'}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-primary-50/80">
                    Review demographics, contact details, and your shared medical record history for this patient.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-primary-50">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-50/70">
                    Patient ID
                  </p>
                  <p className="mt-1 font-mono text-sm">{patientId}</p>
                </div>
              </div>
            </Card>

            <Card>
              <DataPairs
                items={[
                  { label: 'Email', value: data.profile.email || 'Not available' },
                  { label: 'Phone', value: data.profile.phone_number || 'Not available' },
                  { label: 'Date of birth', value: data.patient?.dob || 'Not available' },
                  { label: 'Records linked to you', value: String(data.records?.length || 0) },
                ]}
              />
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Medical records
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Shared history
                </h3>
              </div>

              {!data.records || data.records.length === 0 ? (
                <EmptyState
                  icon="R"
                  title="No medical records found"
                  description="Records will appear here after you create them from the patient’s appointments."
                />
              ) : (
                <div className="grid gap-4">
                  {data.records.map(record => (
                    <Card
                      key={record.id}
                      as={Link}
                      to={`/doctor/records/${record.id}`}
                      interactive
                      className="no-underline"
                    >
                      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr_auto] lg:items-center">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                            Created
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {new Date(record.created_at).toLocaleDateString('en-IN')} {new Date(record.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm leading-relaxed text-slate-600">
                            {record.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="lg:justify-self-end">
                          <StatusBadge status={record.appointments?.status} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </PageLayout>
  )
}
