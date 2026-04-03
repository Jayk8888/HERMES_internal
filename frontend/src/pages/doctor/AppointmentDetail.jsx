import { useEffect, useState } from 'react'
import { ArrowLeft, FilePenLine } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'
import TextInput from '../../components/ui/TextInput'
import Textarea from '../../components/ui/Textarea'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../lib/formatters'
import { VITAL_FIELDS } from '../../lib/medical'
import { supabase } from '../../lib/supabase'

function getProfile(value) {
  if (!value) return {}
  return Array.isArray(value) ? value[0] : value
}

function getInitialVitals() {
  return Object.fromEntries(VITAL_FIELDS.map(field => [field.key, '']))
}

export default function DoctorAppointmentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [creatingRecord, setCreatingRecord] = useState(false)
  const [medicalRecord, setMedicalRecord] = useState(null)
  const [recordForm, setRecordForm] = useState({
    description: '',
    prescription: '',
    vitals: getInitialVitals(),
  })
  const [statusError, setStatusError] = useState('')
  const [recordError, setRecordError] = useState('')

  const { data, loading, error, refetch } = useFetch(async () => {
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        patients (
          id,
          dob,
          profiles (full_name, email, role)
        )
      `)
      .eq('id', id)
      .single()

    if (appointmentError) throw appointmentError

    const { data: recordData, error: recordFetchError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('appointment_id', id)
      .maybeSingle()

    if (recordFetchError && recordFetchError.code !== 'PGRST116') throw recordFetchError

    return {
      appointment: appointmentData,
      record: recordData || null,
    }
  }, [id, user?.id], { key: `doctor-appointment-detail:${user?.id ?? 'anonymous'}:${id ?? 'unknown'}` })

  useEffect(() => {
    setMedicalRecord(data?.record ?? null)
  }, [data])

  async function handleStatusChange(newStatus) {
    if (!window.confirm(`Are you sure you want to change this appointment to ${newStatus}?`)) {
      return
    }

    setUpdatingStatus(true)
    setStatusError('')

    try {
      const { error: rpcError } = await supabase.rpc('update_appointment_status', {
        appointment_id: id,
        new_status: newStatus,
      })

      if (rpcError) throw rpcError
      await refetch()
    } catch (requestError) {
      setStatusError(requestError.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleCreateRecord(event) {
    event.preventDefault()
    setCreatingRecord(true)
    setRecordError('')

    try {
      const vitals = Object.fromEntries(
        Object.entries(recordForm.vitals).filter(([, value]) => value.trim() !== '')
      )

      const { data: newRecord, error: insertError } = await supabase
        .from('medical_records')
        .insert({
          appointment_id: id,
          description: recordForm.description,
          prescription: recordForm.prescription || null,
          vitals: Object.keys(vitals).length > 0 ? vitals : null,
        })
        .select()
        .single()

      if (insertError) throw insertError
      setMedicalRecord(newRecord)
    } catch (requestError) {
      setRecordError(requestError.message)
    } finally {
      setCreatingRecord(false)
    }
  }

  const appointment = data?.appointment
  const patient = getProfile(appointment?.patients)
  const patientProfile = getProfile(patient?.profiles)

  return (
    <PageLayout width="wide">
      <div className="space-y-5">
        <Link
          to="/doctor/appointments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 no-underline hover:text-primary-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to appointments
        </Link>

        {loading ? <LoadingSpinner message="Loading appointment details..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {!loading && !error && !appointment ? (
          <Card>
            <p className="text-sm text-slate-500">Appointment not found.</p>
          </Card>
        ) : null}

        {appointment ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Card tone="brand">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-50/70">
                      Appointment detail
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
                      {patientProfile?.full_name || 'Unknown patient'}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-primary-50/80">
                      {formatDateTime(appointment.scheduled_at)}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              </Card>

              <Card className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Patient information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Name</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{patientProfile?.full_name || 'Unknown patient'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Email</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{patientProfile?.email || 'Not available'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">DOB</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{patient?.dob || 'Not available'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Scheduled at</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(appointment.scheduled_at)}</p>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">Appointment status</h3>
                  <StatusBadge status={appointment.status} />
                </div>

                {statusError ? <ErrorMessage message={statusError} /> : null}

                {appointment.status === 'scheduled' ? (
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => handleStatusChange('completed')} loading={updatingStatus}>
                      Mark completed
                    </Button>
                    <Button variant="secondary" onClick={() => handleStatusChange('cancelled')} loading={updatingStatus}>
                      Cancel appointment
                    </Button>
                  </div>
                ) : (
                  <InlineAlert
                    tone={appointment.status === 'completed' ? 'success' : 'warning'}
                    title={appointment.status === 'completed' ? 'Appointment completed' : 'Appointment cancelled'}
                    message="This appointment is already in a final state. Create or review the medical record on the right."
                  />
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">Medical record</h3>
                  {medicalRecord ? (
                    <Button as={Link} to={`/doctor/records/${medicalRecord.id}`} variant="secondary">
                      <FilePenLine className="h-4 w-4" />
                      Edit record
                    </Button>
                  ) : null}
                </div>

                {medicalRecord ? (
                  <InlineAlert
                    tone="success"
                    title="Record already created"
                    message="This appointment already has a medical record. Open it to review or edit clinical details."
                  />
                ) : (
                  <form className="space-y-4" onSubmit={handleCreateRecord}>
                    <Field label="Description / notes" htmlFor="record-description" required>
                      <Textarea
                        id="record-description"
                        value={recordForm.description}
                        onChange={event => setRecordForm(current => ({ ...current, description: event.target.value }))}
                        required
                      />
                    </Field>

                    <Field label="Prescription" htmlFor="record-prescription">
                      <Textarea
                        id="record-prescription"
                        value={recordForm.prescription}
                        onChange={event => setRecordForm(current => ({ ...current, prescription: event.target.value }))}
                      />
                    </Field>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Vitals</p>
                        <p className="text-xs text-slate-400">Optional. Leave any field blank to skip it.</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {VITAL_FIELDS.map(field => (
                          <Field key={field.key} label={field.label} htmlFor={field.key}>
                            <TextInput
                              id={field.key}
                              value={recordForm.vitals[field.key]}
                              onChange={event => setRecordForm(current => ({
                                ...current,
                                vitals: {
                                  ...current.vitals,
                                  [field.key]: event.target.value,
                                },
                              }))}
                              placeholder={field.placeholder}
                            />
                          </Field>
                        ))}
                      </div>
                    </div>

                    {recordError ? <ErrorMessage message={recordError} /> : null}

                    <Button type="submit" loading={creatingRecord}>
                      {creatingRecord ? 'Creating...' : 'Create record'}
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </PageLayout>
  )
}
