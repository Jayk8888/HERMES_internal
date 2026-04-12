import React from 'react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import Select from '../../components/ui/Select'
import TextInput from '../../components/ui/TextInput'
import { invalidateFetchCache, useFetch } from '../../hooks/useFetch'
import AdminSection from './components/AdminSection'
import { AdminAppointmentDetailSkeleton, AdminEmptyState, AdminErrorState } from './components/AdminPageState'
import { loadAdminAppointmentDetail, updateAdminAppointment } from './lib/loaders'
import { validateAppointmentForm } from './lib/validators'

export default function AdminAppointmentDetail() {
  const { id } = useParams()
  const { data, loading, error, refetch } = useFetch(() => loadAdminAppointmentDetail(id), [id], {
    key: `admin:appointment:${id}`,
  })
  const [draft, setDraft] = React.useState({ scheduledAt: '', status: 'scheduled' })
  const [errors, setErrors] = React.useState({})
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState(null)

  React.useEffect(() => {
    if (data) {
      setDraft({
        patientId: data.patientId,
        doctorId: data.doctorId,
        scheduledAt: data.scheduledAt ? data.scheduledAt.slice(0, 16) : '',
        status: data.status,
      })
    }
  }, [data])

  async function handleSave(event) {
    event.preventDefault()
    const nextErrors = validateAppointmentForm(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setMessage(null)

    try {
      await updateAdminAppointment({
        p_appointment_id: data.id,
        p_patient_id: data.patientId,
        p_doctor_id: data.doctorId,
        p_scheduled_at: new Date(draft.scheduledAt).toISOString(),
        p_status: draft.status,
      })
      invalidateFetchCache('admin:appointments')
      invalidateFetchCache(`admin:appointment:${data.id}`)
      invalidateFetchCache('admin:dashboard')
      invalidateFetchCache('admin:records')
      setMessage({ tone: 'success', text: 'Appointment updated' })
      await refetch()
    } catch (saveError) {
      setMessage({ tone: 'critical', text: saveError.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLayout width="wide"><AdminAppointmentDetailSkeleton /></PageLayout>
  if (error) return <PageLayout width="wide"><AdminErrorState error={error} onRetry={refetch} /></PageLayout>
  if (!data) return <PageLayout width="wide"><AdminEmptyState title="Appointment missing" description="Requested appointment not found." icon="?" /></PageLayout>

  return (
    <PageLayout
      width="wide"
      actions={data.hasRecord
        ? <Button as={Link} to={`/admin/records/${data.recordId}`} size="small" variant="secondary">Open record</Button>
        : <Button as={Link} to="/admin/records" size="small">Create record</Button>}
    >
      <form className="space-y-6" onSubmit={handleSave}>
        {message ? <InlineAlert tone={message.tone} message={message.text} /> : null}

        <AdminSection title="Appointment detail" description={`${data.patientName} with ${data.doctorName}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Patient">
              <TextInput value={data.patientName} readOnly />
            </Field>
            <Field label="Doctor">
              <TextInput value={data.doctorName} readOnly />
            </Field>
            <Field label="Scheduled at" error={errors.scheduledAt}>
              <TextInput type="datetime-local" value={draft.scheduledAt} onChange={event => setDraft(current => ({ ...current, scheduledAt: event.target.value }))} />
            </Field>
            <Field label="Status" error={errors.status}>
              <Select value={draft.status} onChange={event => setDraft(current => ({ ...current, status: event.target.value }))}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>
          </div>
        </AdminSection>

        <AdminSection title="Record status" description={data.hasRecord ? 'Medical record linked.' : 'No medical record yet.'}>
          {data.hasRecord ? (
            <Button as={Link} to={`/admin/records/${data.recordId}`} variant="secondary">Open record</Button>
          ) : (
            <Button as={Link} to="/admin/records">Go to needs-record queue</Button>
          )}
        </AdminSection>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Save appointment</Button>
        </div>
      </form>
    </PageLayout>
  )
}
