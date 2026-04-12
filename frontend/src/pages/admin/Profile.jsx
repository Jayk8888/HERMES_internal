import React from 'react'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import Select from '../../components/ui/Select'
import TextInput from '../../components/ui/TextInput'
import { useAuth } from '../../hooks/useAuth.jsx'
import { invalidateFetchCache, useFetch } from '../../hooks/useFetch'
import AdminSection from './components/AdminSection'
import { AdminErrorState, AdminProfileSkeleton } from './components/AdminPageState'
import { loadOwnAdminProfile, saveAdminUser } from './lib/loaders'

export default function AdminProfile() {
  const { user } = useAuth()
  const { data, loading, error, refetch } = useFetch(() => loadOwnAdminProfile(user?.id), [user?.id], {
    enabled: Boolean(user?.id),
    key: user?.id ? `admin:profile:${user.id}` : null,
  })
  const [draft, setDraft] = React.useState({ fullName: '', phoneNumber: '', gender: '' })
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState(null)

  React.useEffect(() => {
    if (data) {
      setDraft({
        fullName: data.fullName ?? '',
        phoneNumber: data.phoneNumber ?? '',
        gender: data.gender ?? '',
      })
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
        p_role: 'admin',
      })
      invalidateFetchCache(`admin:profile:${data.id}`)
      invalidateFetchCache('admin:users')
      invalidateFetchCache(`admin:user:${data.id}`)
      invalidateFetchCache('admin:dashboard')
      setMessage({ tone: 'success', text: 'Profile saved' })
      await refetch()
    } catch (saveError) {
      setMessage({ tone: 'critical', text: saveError.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLayout width="wide"><AdminProfileSkeleton /></PageLayout>
  if (error) return <PageLayout width="wide"><AdminErrorState error={error} onRetry={refetch} /></PageLayout>

  return (
    <PageLayout width="wide">
      <form className="space-y-6" onSubmit={handleSave}>
        {message ? <InlineAlert tone={message.tone} message={message.text} /> : null}
        <AdminSection title="Admin profile" description={data?.email}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <TextInput value={draft.fullName} onChange={event => setDraft(current => ({ ...current, fullName: event.target.value }))} />
            </Field>
            <Field label="Phone">
              <TextInput value={draft.phoneNumber} onChange={event => setDraft(current => ({ ...current, phoneNumber: event.target.value }))} />
            </Field>
            <Field label="Gender">
              <Select value={draft.gender} onChange={event => setDraft(current => ({ ...current, gender: event.target.value }))}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Role">
              <TextInput value="admin" readOnly />
            </Field>
          </div>
        </AdminSection>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Save profile</Button>
        </div>
      </form>
    </PageLayout>
  )
}
