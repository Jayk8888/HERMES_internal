import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import TextInput from '../../components/ui/TextInput'
import { invalidateFetchCache, useFetch } from '../../hooks/useFetch'
import { useSessionState } from '../../hooks/useSessionState'
import AdminDataTable, { AdminLinkCell } from './components/AdminDataTable'
import AdminQueueList from './components/AdminQueueList'
import AdminSection from './components/AdminSection'
import { AdminErrorState, AdminRecordsSkeleton } from './components/AdminPageState'
import { loadAdminAppointments, loadAdminRecords, saveAdminMedicalRecord } from './lib/loaders'
import { buildRecordQueue } from './lib/normalizers'
import { validateMedicalRecordForm } from './lib/validators'

const EMPTY_RECORD_DRAFT = {
  appointmentId: '',
  description: '',
  prescription: '',
  vitalsText: '',
}

export default function AdminRecords() {
  const [searchParams, setSearchParams] = useSearchParams()
  const recordsFetch = useFetch(loadAdminRecords, [], {
    key: 'admin:records',
  })
  const appointmentsFetch = useFetch(loadAdminAppointments, [], {
    key: 'admin:appointments',
  })
  const [draft, setDraft, clearDraft] = useSessionState('admin:records:draft', EMPTY_RECORD_DRAFT)
  const [errors, setErrors] = React.useState({})
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState(null)
  const queue = buildRecordQueue(appointmentsFetch.data ?? [])
  const queueOptions = queue.map(item => ({
    value: item.id,
    label: `${item.patientName} · ${item.doctorName} · ${item.scheduledLabel}`,
  }))
  const requestedAppointmentId = searchParams.get('appointmentId')

  React.useEffect(() => {
    if (!requestedAppointmentId) return
    if (!queue.some(item => item.id === requestedAppointmentId)) return

    setDraft(current => (
      current.appointmentId === requestedAppointmentId
        ? current
        : { ...current, appointmentId: requestedAppointmentId }
    ))

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('appointmentId')
    setSearchParams(nextParams, { replace: true })
  }, [queue, requestedAppointmentId, searchParams, setDraft, setSearchParams])

  if (recordsFetch.loading || appointmentsFetch.loading) {
    return <PageLayout width="wide"><AdminRecordsSkeleton /></PageLayout>
  }

  if (recordsFetch.error || appointmentsFetch.error) {
    return <PageLayout width="wide"><AdminErrorState error={recordsFetch.error || appointmentsFetch.error} onRetry={() => {
      void recordsFetch.refetch()
      void appointmentsFetch.refetch()
    }} /></PageLayout>
  }

  async function handleSave(event) {
    event.preventDefault()
    const nextErrors = validateMedicalRecordForm(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setMessage(null)

    try {
      await saveAdminMedicalRecord({
        p_appointment_id: draft.appointmentId,
        p_description: draft.description,
        p_prescription: draft.prescription || null,
        p_vitals: draft.vitalsText ? JSON.parse(draft.vitalsText) : null,
      })
      invalidateFetchCache('admin:records')
      invalidateFetchCache('admin:appointments')
      invalidateFetchCache('admin:dashboard')
      clearDraft(EMPTY_RECORD_DRAFT)
      setMessage({ tone: 'success', text: 'Record saved' })
      await recordsFetch.refetch()
      await appointmentsFetch.refetch()
    } catch (saveError) {
      setMessage({ tone: 'critical', text: saveError.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <AdminSection title="Record editor" description="Completed appointments without record only.">
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Appointment" error={errors.appointmentId}>
                <Select value={draft.appointmentId} onChange={event => setDraft(current => ({ ...current, appointmentId: event.target.value }))}>
                  <option value="">Select completed appointment</option>
                  {queueOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
              <Field label="Vitals JSON" error={errors.vitalsText}>
                <TextInput
                  value={draft.vitalsText}
                  onChange={event => setDraft(current => ({ ...current, vitalsText: event.target.value }))}
                  placeholder='{"bp":"120/80"}'
                />
              </Field>
            </div>
            <Field label="Description" error={errors.description}>
              <Textarea value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} />
            </Field>
            <Field label="Prescription">
              <Textarea value={draft.prescription} onChange={event => setDraft(current => ({ ...current, prescription: event.target.value }))} />
            </Field>
            <div className="flex items-center justify-between gap-4">
              {message ? <InlineAlert tone={message.tone} message={message.text} /> : <span />}
              <Button type="submit" loading={saving}>Save record</Button>
            </div>
          </form>
        </AdminSection>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
          <AdminQueueList
            title="Needs record"
            description="Completed appointments missing record."
            items={queue}
            to={item => `/admin/appointments/${item.id}`}
            emptyLabel="Queue clear."
            renderMeta={item => `${item.doctorName} · ${item.scheduledLabel}`}
          />

          <AdminDataTable
            columns={[
              {
                key: 'patientName',
                label: 'Record',
                render: row => (
                  <AdminLinkCell
                    to={`/admin/records/${row.id}`}
                    primary={row.patientName}
                    secondary={`${row.doctorName} · ${row.createdLabel}`}
                  />
                ),
              },
              { key: 'status', label: 'Appointment status' },
              {
                key: 'appointmentId',
                label: 'Appointment',
                render: row => <Button as={Link} to={`/admin/appointments/${row.appointmentId}`} variant="secondary" size="small">Open</Button>,
              },
            ]}
            rows={recordsFetch.data}
            emptyTitle="No records"
            emptyDescription="Saved records appear here."
          />
        </div>
      </div>
    </PageLayout>
  )
}
