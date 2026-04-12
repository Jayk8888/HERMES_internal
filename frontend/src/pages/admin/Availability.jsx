import React from 'react'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import Select from '../../components/ui/Select'
import TextInput from '../../components/ui/TextInput'
import { invalidateFetchCache, useFetch } from '../../hooks/useFetch'
import { useSessionState } from '../../hooks/useSessionState'
import AdminSection from './components/AdminSection'
import { AdminAvailabilitySkeleton, AdminErrorState } from './components/AdminPageState'
import { createAvailabilitySlot, deleteAvailabilitySlot, loadAdminAvailability, updateAvailabilitySlot } from './lib/loaders'
import { ADMIN_DAY_ORDER } from './lib/normalizers'
import { validateAvailabilitySlot } from './lib/validators'

const EMPTY_AVAILABILITY_DRAFT = {
  day: 'Monday',
  startTime: '',
  endTime: '',
}

export default function AdminAvailability() {
  const { data, loading, error, refetch } = useFetch(loadAdminAvailability, [], {
    key: 'admin:availability',
  })
  const [doctorId, setDoctorId] = useSessionState('admin:availability:doctorId', '')
  const [editing, setEditing, clearEditing] = useSessionState('admin:availability:editing', null)
  const [draft, setDraft, clearDraft] = useSessionState('admin:availability:draft', EMPTY_AVAILABILITY_DRAFT)
  const [errors, setErrors] = React.useState({})
  const [message, setMessage] = React.useState(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!doctorId && data?.length) {
      setDoctorId(data[0].id)
    }
  }, [data, doctorId, setDoctorId])

  if (loading) return <PageLayout width="wide"><AdminAvailabilitySkeleton /></PageLayout>
  if (error) return <PageLayout width="wide"><AdminErrorState error={error} onRetry={refetch} /></PageLayout>

  const selectedDoctor = data.find(row => row.id === doctorId) ?? null
  const currentSlots = selectedDoctor?.slots ?? []

  function resetDraft() {
    clearEditing(null)
    clearDraft(EMPTY_AVAILABILITY_DRAFT)
    setErrors({})
  }

  async function handleSave(event) {
    event.preventDefault()
    const values = { ...draft, doctorId }
    const nextErrors = validateAvailabilitySlot(values, currentSlots, editing?.id ?? null)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setMessage(null)
    try {
      if (editing) {
        await updateAvailabilitySlot(editing.id, {
          doctor_id: doctorId,
          day: draft.day,
          start_time: draft.startTime,
          end_time: draft.endTime,
        })
      } else {
        await createAvailabilitySlot({
          doctor_id: doctorId,
          day: draft.day,
          start_time: draft.startTime,
          end_time: draft.endTime,
        })
      }
      invalidateFetchCache('admin:availability')
      invalidateFetchCache('admin:dashboard')
      setMessage({ tone: 'success', text: editing ? 'Slot updated' : 'Slot created' })
      resetDraft()
      await refetch()
    } catch (saveError) {
      setMessage({ tone: 'critical', text: saveError.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(slotId) {
    setMessage(null)
    try {
      await deleteAvailabilitySlot(slotId)
      invalidateFetchCache('admin:availability')
      invalidateFetchCache('admin:dashboard')
      setMessage({ tone: 'success', text: 'Slot deleted' })
      if (editing?.id === slotId) {
        resetDraft()
      }
      await refetch()
    } catch (deleteError) {
      setMessage({ tone: 'critical', text: deleteError.message })
    }
  }

  function beginEdit(slot) {
    setEditing(slot)
    setDraft({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
    })
  }

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <AdminSection title="Doctor schedule" description="Weekly slot board with overlap guard.">
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <Field label="Doctor">
              <Select value={doctorId} onChange={event => {
                setDoctorId(event.target.value)
                clearEditing(null)
              }}>
                {data.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
              </Select>
            </Field>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{selectedDoctor?.fullName ?? 'No doctor selected'}</p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedDoctor?.specialization || 'No specialization'} · {selectedDoctor?.slotCount ?? 0} slots
              </p>
            </div>
          </div>
          {message ? <div className="mt-4"><InlineAlert tone={message.tone} message={message.text} /></div> : null}
        </AdminSection>

        <AdminSection title={editing ? 'Edit slot' : 'Add slot'}>
          <form className="grid gap-4 lg:grid-cols-5" onSubmit={handleSave}>
            <Field label="Day" error={errors.day}>
              <Select value={draft.day} onChange={event => setDraft(current => ({ ...current, day: event.target.value }))}>
                {ADMIN_DAY_ORDER.map(day => <option key={day} value={day}>{day}</option>)}
              </Select>
            </Field>
            <Field label="Start" error={errors.startTime}>
              <TextInput type="time" value={draft.startTime} onChange={event => setDraft(current => ({ ...current, startTime: event.target.value }))} />
            </Field>
            <Field label="End" error={errors.endTime}>
              <TextInput type="time" value={draft.endTime} onChange={event => setDraft(current => ({ ...current, endTime: event.target.value }))} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" loading={saving} block>{editing ? 'Update slot' : 'Add slot'}</Button>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="secondary" block onClick={resetDraft}>Clear</Button>
            </div>
          </form>
        </AdminSection>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {ADMIN_DAY_ORDER.map(day => {
            const slots = selectedDoctor?.groupedSlots.find(group => group.day === day)?.slots ?? []

            return (
              <AdminSection key={day} title={day} className="h-full">
                {slots.length ? (
                  <div className="space-y-3">
                    {slots.map(slot => (
                      <div key={slot.id} className="rounded-xl border border-slate-200 p-3">
                        <p className="font-semibold text-slate-900">{slot.label}</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="small" variant="secondary" onClick={() => beginEdit(slot)}>Edit</Button>
                          <Button size="small" variant="danger" onClick={() => handleDelete(slot.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No slots.</p>
                )}
              </AdminSection>
            )
          })}
        </div>
      </div>
    </PageLayout>
  )
}
