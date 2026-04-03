import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
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

function getInitialVitals(record) {
  const currentVitals = record?.vitals ?? {}
  return Object.fromEntries(
    VITAL_FIELDS.map(field => [field.key, currentVitals[field.key] ?? ''])
  )
}

export default function DoctorRecordDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [updatingRecord, setUpdatingRecord] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [recordForm, setRecordForm] = useState({
    description: '',
    prescription: '',
    vitals: getInitialVitals(null),
  })

  const { data: record, loading, error, refetch } = useFetch(async () => {
    const { data, error: fetchError } = await supabase
      .from('medical_records')
      .select(`
        *,
        appointments (
          id,
          scheduled_at,
          status,
          patients (
            profiles (
              full_name
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    return data
  }, [id, user?.id], { key: `doctor-record-detail:${user?.id ?? 'anonymous'}:${id ?? 'unknown'}` })

  useEffect(() => {
    if (!record) return

    setRecordForm({
      description: record.description || '',
      prescription: record.prescription || '',
      vitals: getInitialVitals(record),
    })
  }, [record])

  async function handleUpdateRecord(event) {
    event.preventDefault()
    setUpdatingRecord(true)
    setSaveError('')
    setSaveMessage('')

    try {
      const vitals = Object.fromEntries(
        Object.entries(recordForm.vitals).filter(([, value]) => value.trim() !== '')
      )

      const { error: updateError } = await supabase
        .from('medical_records')
        .update({
          description: recordForm.description,
          prescription: recordForm.prescription || null,
          vitals: Object.keys(vitals).length > 0 ? vitals : null,
        })
        .eq('id', id)

      if (updateError) throw updateError
      setSaveMessage('Medical record updated successfully.')
      await refetch()
    } catch (requestError) {
      setSaveError(requestError.message)
    } finally {
      setUpdatingRecord(false)
    }
  }

  const patientProfile = getProfile(record?.appointments?.patients?.profiles)

  return (
    <PageLayout width="wide">
      <div className="space-y-5">
        {record?.appointment_id ? (
          <Link
            to={`/doctor/appointments/${record.appointment_id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 no-underline hover:text-primary-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to appointment
          </Link>
        ) : null}

        {loading ? <LoadingSpinner message="Loading medical record..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {!loading && !error && !record ? (
          <Card>
            <p className="text-sm text-slate-500">Record not found.</p>
          </Card>
        ) : null}

        {record ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Related appointment</h3>
              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Patient</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{patientProfile?.full_name || 'Unknown patient'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Scheduled</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(record.appointments?.scheduled_at)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Status</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-slate-900">{record.appointments?.status || 'Not available'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Record created</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(record.created_at)}</p>
                </div>
              </div>
            </Card>

            <Card className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Record editor
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Update clinical details</h3>
              </div>

              {saveError ? <ErrorMessage message={saveError} /> : null}
              {saveMessage ? <InlineAlert tone="success" title="Saved" message={saveMessage} /> : null}

              <form className="space-y-4" onSubmit={handleUpdateRecord}>
                <Field label="Description / notes" htmlFor="doctor-record-description" required>
                  <Textarea
                    id="doctor-record-description"
                    value={recordForm.description}
                    onChange={event => setRecordForm(current => ({ ...current, description: event.target.value }))}
                    required
                  />
                </Field>

                <Field label="Prescription" htmlFor="doctor-record-prescription">
                  <Textarea
                    id="doctor-record-prescription"
                    value={recordForm.prescription}
                    onChange={event => setRecordForm(current => ({ ...current, prescription: event.target.value }))}
                  />
                </Field>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Vitals</p>
                    <p className="text-xs text-slate-400">Edit the structured vitals captured for this appointment.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {VITAL_FIELDS.map(field => (
                      <Field key={field.key} label={field.label} htmlFor={`edit-${field.key}`}>
                        <TextInput
                          id={`edit-${field.key}`}
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

                <Button type="submit" loading={updatingRecord}>
                  {updatingRecord ? 'Saving...' : 'Save changes'}
                </Button>
              </form>
            </Card>
          </div>
        ) : null}
      </div>
    </PageLayout>
  )
}
