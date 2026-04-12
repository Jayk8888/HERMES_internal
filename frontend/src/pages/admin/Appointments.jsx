import React from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import Select from '../../components/ui/Select'
import TextInput from '../../components/ui/TextInput'
import { invalidateFetchCache, useFetch } from '../../hooks/useFetch'
import { useSessionState } from '../../hooks/useSessionState'
import AdminDataTable, { AdminLinkCell, AdminStatusCell } from './components/AdminDataTable'
import AdminFilterBar from './components/AdminFilterBar'
import AdminSection from './components/AdminSection'
import { AdminAppointmentsSkeleton, AdminErrorState } from './components/AdminPageState'
import { createAdminAppointment, loadAdminAppointments, loadAdminUsers } from './lib/loaders'
import { filterAppointments } from './lib/normalizers'
import { validateAppointmentForm } from './lib/validators'

const EMPTY_APPOINTMENT_FILTERS = {
  status: 'all',
  doctorId: 'all',
  patientId: 'all',
  date: '',
}

const EMPTY_APPOINTMENT_DRAFT = {
  patientId: '',
  doctorId: '',
  scheduledAt: '',
  status: 'scheduled',
}

export default function AdminAppointments() {
  const appointmentsFetch = useFetch(loadAdminAppointments, [], {
    key: 'admin:appointments',
  })
  const usersFetch = useFetch(loadAdminUsers, [], {
    key: 'admin:users',
  })
  const [filters, setFilters] = useSessionState('admin:appointments:filters', EMPTY_APPOINTMENT_FILTERS)
  const [draft, setDraft, clearDraft] = useSessionState('admin:appointments:draft', EMPTY_APPOINTMENT_DRAFT)
  const [errors, setErrors] = React.useState({})
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState(null)

  if (appointmentsFetch.loading || usersFetch.loading) {
    return <PageLayout width="wide"><AdminAppointmentsSkeleton /></PageLayout>
  }

  if (appointmentsFetch.error || usersFetch.error) {
    return (
      <PageLayout width="wide">
        <AdminErrorState error={appointmentsFetch.error || usersFetch.error} onRetry={() => {
          void appointmentsFetch.refetch()
          void usersFetch.refetch()
        }} />
      </PageLayout>
    )
  }

  const users = usersFetch.data
  const doctors = users.filter(user => user.role === 'doctor' && user.integrity === 'healthy')
  const patients = users.filter(user => user.role === 'patient' && user.integrity === 'healthy')
  const rows = filterAppointments(appointmentsFetch.data, filters)

  async function handleCreate(event) {
    event.preventDefault()
    const nextErrors = validateAppointmentForm(draft)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setMessage(null)

    try {
      await createAdminAppointment({
        p_patient_id: draft.patientId,
        p_doctor_id: draft.doctorId,
        p_scheduled_at: new Date(draft.scheduledAt).toISOString(),
      })
      invalidateFetchCache('admin:appointments')
      invalidateFetchCache('admin:dashboard')
      invalidateFetchCache('admin:records')
      clearDraft(EMPTY_APPOINTMENT_DRAFT)
      setMessage({ tone: 'success', text: 'Appointment created' })
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
        <AdminSection title="Create appointment">
          <form className="grid gap-4 lg:grid-cols-4" onSubmit={handleCreate}>
            <Field label="Patient" error={errors.patientId}>
              <Select value={draft.patientId} onChange={event => setDraft(current => ({ ...current, patientId: event.target.value }))}>
                <option value="">Select patient</option>
                {patients.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
              </Select>
            </Field>
            <Field label="Doctor" error={errors.doctorId}>
              <Select value={draft.doctorId} onChange={event => setDraft(current => ({ ...current, doctorId: event.target.value }))}>
                <option value="">Select doctor</option>
                {doctors.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
              </Select>
            </Field>
            <Field label="Date time" error={errors.scheduledAt}>
              <TextInput type="datetime-local" value={draft.scheduledAt} onChange={event => setDraft(current => ({ ...current, scheduledAt: event.target.value }))} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" loading={saving} block>Create</Button>
            </div>
          </form>
          {message ? <div className="mt-4"><InlineAlert tone={message.tone} message={message.text} /></div> : null}
        </AdminSection>

        <AdminFilterBar>
          <Field label="Status">
            <Select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}>
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </Field>
          <Field label="Doctor">
            <Select value={filters.doctorId} onChange={event => setFilters(current => ({ ...current, doctorId: event.target.value }))}>
              <option value="all">All doctors</option>
              {doctors.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
            </Select>
          </Field>
          <Field label="Patient">
            <Select value={filters.patientId} onChange={event => setFilters(current => ({ ...current, patientId: event.target.value }))}>
              <option value="all">All patients</option>
              {patients.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
            </Select>
          </Field>
          <Field label="Date">
            <TextInput type="date" value={filters.date} onChange={event => setFilters(current => ({ ...current, date: event.target.value }))} />
          </Field>
        </AdminFilterBar>

        <AdminDataTable
          columns={[
            { key: 'patientName', label: 'Patient' },
            {
              key: 'scheduledLabel',
              label: 'When',
              render: row => <AdminLinkCell to={`/admin/appointments/${row.id}`} primary={row.scheduledLabel} />,
            },
            { key: 'doctorName', label: 'Doctor' },
            {
              key: 'status',
              label: 'Status',
              render: row => <AdminStatusCell status={row.status} />,
            },
            {
              key: 'recordStatus',
              label: 'Record',
              render: row => (
                row.hasRecord
                  ? <Button as={Link} to={`/admin/records/${row.recordId}`} variant="secondary" size="small">Open</Button>
                  : <Button as={Link} to={`/admin/records?appointmentId=${row.id}`} size="small">Create record</Button>
              ),
            },
          ]}
          rows={rows}
          emptyTitle="No appointments"
          emptyDescription="Adjust filters or create appointment."
        />
  
      </div>
    </PageLayout>
  )
}
