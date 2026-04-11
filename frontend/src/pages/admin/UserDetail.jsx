import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import Select from '../../components/ui/Select'
import TextInput from '../../components/ui/TextInput'
import { useFetch } from '../../hooks/useFetch'
import AdminSection from './components/AdminSection'
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from './components/AdminPageState'
import { loadAdminUserDetail, saveAdminUser } from './lib/loaders'

function buildDraft(user) {
  return {
    fullName: user.fullName ?? '',
    phoneNumber: user.phoneNumber ?? '',
    gender: user.gender ?? '',
    role: user.role ?? '',
    specialization: user.doctor?.specialization ?? '',
    licenseNo: user.doctor?.license_no ?? '',
    dob: user.patient?.dob ?? '',
    address: user.patient?.address ?? '',
  }
}

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch(() => loadAdminUserDetail(id), [id])
  const [draft, setDraft] = React.useState(null)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState(null)

  React.useEffect(() => {
    if (data) {
      setDraft(buildDraft(data))
    }
  }, [data])

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await saveAdminUser({
        p_user_id: data.id,
        p_full_name: draft.fullName,
        p_phone_number: draft.phoneNumber || null,
        p_gender: draft.gender || null,
        p_role: data.role,
        p_dob: data.role === 'patient' ? draft.dob || null : null,
        p_address: data.role === 'patient' ? draft.address || null : null,
        p_specialization: data.role === 'doctor' ? draft.specialization || null : null,
        p_license_no: data.role === 'doctor' ? draft.licenseNo || null : null,
      })
      setMessage({ tone: 'success', text: 'User saved' })
      await refetch()
    } catch (saveError) {
      setMessage({ tone: 'critical', text: saveError.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLayout width="wide"><AdminLoadingState /></PageLayout>
  }

  if (error) {
    return <PageLayout width="wide"><AdminErrorState error={error} onRetry={refetch} /></PageLayout>
  }

  if (!data || !draft) {
    return <PageLayout width="wide"><AdminEmptyState title="User missing" description="Requested user not found." icon="?" /></PageLayout>
  }

  return (
    <PageLayout
      width="wide"
      actions={<Button variant="secondary" size="small" onClick={() => navigate('/admin/users')}>Back</Button>}
    >
      <form className="space-y-6" onSubmit={handleSave}>
        {message ? <InlineAlert tone={message.tone} message={message.text} /> : null}

        <AdminSection title={data.fullName} description={data.email}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" htmlFor="fullName">
              <TextInput id="fullName" value={draft.fullName} onChange={event => setDraft(current => ({ ...current, fullName: event.target.value }))} />
            </Field>
            <Field label="Phone" htmlFor="phoneNumber">
              <TextInput id="phoneNumber" value={draft.phoneNumber} onChange={event => setDraft(current => ({ ...current, phoneNumber: event.target.value }))} />
            </Field>
            <Field label="Gender" htmlFor="gender">
              <Select id="gender" value={draft.gender} onChange={event => setDraft(current => ({ ...current, gender: event.target.value }))}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Role" htmlFor="role" hint="Role locked.">
              <TextInput id="role" value={draft.role} readOnly aria-label="Role" />
            </Field>
          </div>
        </AdminSection>

        {data.role === 'doctor' ? (
          <AdminSection title="Doctor fields">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Specialization">
                <TextInput value={draft.specialization} onChange={event => setDraft(current => ({ ...current, specialization: event.target.value }))} />
              </Field>
              <Field label="License no">
                <TextInput value={draft.licenseNo} onChange={event => setDraft(current => ({ ...current, licenseNo: event.target.value }))} />
              </Field>
            </div>
          </AdminSection>
        ) : null}

        {data.role === 'patient' ? (
          <AdminSection title="Patient fields">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Date of birth">
                <TextInput type="date" value={draft.dob} onChange={event => setDraft(current => ({ ...current, dob: event.target.value }))} />
              </Field>
              <Field label="Address" className="md:col-span-2">
                <TextInput value={draft.address} onChange={event => setDraft(current => ({ ...current, address: event.target.value }))} />
              </Field>
            </div>
          </AdminSection>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Save user</Button>
        </div>
      </form>
    </PageLayout>
  )
}
