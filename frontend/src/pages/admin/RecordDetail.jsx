import React from 'react'
import { useParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import Textarea from '../../components/ui/Textarea'
import TextInput from '../../components/ui/TextInput'
import { useFetch } from '../../hooks/useFetch'
import AdminSection from './components/AdminSection'
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from './components/AdminPageState'
import { loadAdminRecordDetail, saveAdminMedicalRecord } from './lib/loaders'
import { validateMedicalRecordForm } from './lib/validators'

export default function AdminRecordDetail() {
  const { id } = useParams()
  const { data, loading, error, refetch } = useFetch(() => loadAdminRecordDetail(id), [id])
  const [draft, setDraft] = React.useState({ appointmentId: '', description: '', prescription: '', vitalsText: '' })
  const [errors, setErrors] = React.useState({})
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState(null)

  React.useEffect(() => {
    if (data) {
      setDraft({
        appointmentId: data.appointmentId,
        description: data.description ?? '',
        prescription: data.prescription ?? '',
        vitalsText: data.vitals ? JSON.stringify(data.vitals) : '',
      })
    }
  }, [data])

  async function handleSave(event) {
    event.preventDefault()
    const nextErrors = validateMedicalRecordForm(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setMessage(null)
    try {
      await saveAdminMedicalRecord({
        p_record_id: data.id,
        p_appointment_id: draft.appointmentId,
        p_description: draft.description,
        p_prescription: draft.prescription || null,
        p_vitals: draft.vitalsText ? JSON.parse(draft.vitalsText) : null,
      })
      setMessage({ tone: 'success', text: 'Record updated' })
      await refetch()
    } catch (saveError) {
      setMessage({ tone: 'critical', text: saveError.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLayout width="wide"><AdminLoadingState /></PageLayout>
  if (error) return <PageLayout width="wide"><AdminErrorState error={error} onRetry={refetch} /></PageLayout>
  if (!data) return <PageLayout width="wide"><AdminEmptyState title="Record missing" description="Requested record not found." icon="?" /></PageLayout>

  return (
    <PageLayout width="wide">
      <form className="space-y-6" onSubmit={handleSave}>
        {message ? <InlineAlert tone={message.tone} message={message.text} /> : null}
        <AdminSection title="Record context" description={`${data.patientName} with ${data.doctorName}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Appointment">
              <TextInput value={data.appointment?.scheduledLabel ?? ''} readOnly />
            </Field>
            <Field label="Created">
              <TextInput value={data.createdLabel} readOnly />
            </Field>
          </div>
        </AdminSection>
        <AdminSection title="Record editor">
          <div className="space-y-4">
            <Field label="Description" error={errors.description}>
              <Textarea value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} />
            </Field>
            <Field label="Prescription">
              <Textarea value={draft.prescription} onChange={event => setDraft(current => ({ ...current, prescription: event.target.value }))} />
            </Field>
            <Field label="Vitals JSON" error={errors.vitalsText}>
              <Textarea value={draft.vitalsText} onChange={event => setDraft(current => ({ ...current, vitalsText: event.target.value }))} className="min-h-[140px]" />
            </Field>
          </div>
        </AdminSection>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Save record</Button>
        </div>
      </form>
    </PageLayout>
  )
}
