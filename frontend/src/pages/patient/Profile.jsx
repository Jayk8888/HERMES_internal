import { useEffect, useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import DataPairs from '../../components/ui/DataPairs'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import InlineAlert from '../../components/ui/InlineAlert'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import SectionHeader from '../../components/ui/SectionHeader'
import Select from '../../components/ui/Select'
import TextInput from '../../components/ui/TextInput'
import Textarea from '../../components/ui/Textarea'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

export default function PatientProfile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    gender: 'male',
    dob: '',
    address: '',
  })
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return null

    const [profileResponse, patientResponse] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, phone_number, gender')
        .eq('id', user.id)
        .single(),
      supabase
        .from('patients')
        .select('dob, address')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    if (profileResponse.error) throw profileResponse.error
    if (patientResponse.error) throw patientResponse.error

    return {
      profile: profileResponse.data,
      patient: patientResponse.data,
    }
  }, [user?.id], { key: `patient-profile:${user?.id ?? 'anonymous'}` })

  useEffect(() => {
    if (!data?.profile) return

    setForm({
      full_name: data.profile.full_name ?? '',
      phone_number: data.profile.phone_number ?? '',
      gender: data.profile.gender ?? 'male',
      dob: data.patient?.dob ?? '',
      address: data.patient?.address ?? '',
    })
  }, [data])

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user?.id || !data?.profile) return

    setSaving(true)
    setSaveError('')
    setSaveMessage('')

    try {
      const trimmedName = form.full_name.trim()
      if (!trimmedName) throw new Error('Full name is required.')

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName,
          phone_number: form.phone_number.trim() || null,
          gender: form.gender,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      if (data.patient) {
        const { error: patientError } = await supabase
          .from('patients')
          .update({
            dob: form.dob || data.patient.dob,
            address: form.address.trim() || null,
          })
          .eq('id', user.id)

        if (patientError) throw patientError
      }

      setSaveMessage(
        data.patient
          ? 'Profile updated successfully.'
          : 'Basic profile updated. Date of birth and address are unavailable because no patient record exists yet.'
      )
      await refetch()
    } catch (requestError) {
      setSaveError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <SectionHeader
          title="Profile and clinical identity"
          description="Review your account details and keep your personal information current."
        />

        {loading ? <LoadingSpinner message="Loading your profile..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {data?.profile ? (
          <>
            <Card className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Account overview
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{data.profile.full_name}</h3>
                <p className="mt-1 text-sm text-slate-500">{data.profile.email}</p>
              </div>

              <DataPairs
                items={[
                  { label: 'Phone number', value: data.profile.phone_number || 'Not provided' },
                  { label: 'Gender', value: data.profile.gender || 'Not provided' },
                  { label: 'Date of birth', value: formatDate(data.patient?.dob) },
                  { label: 'Address', value: data.patient?.address || 'Not provided' },
                ]}
              />
            </Card>

            <Card className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Edit details
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Update profile</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Email is managed separately. You can update your name, phone number, gender, date of birth, and address here.
                </p>
              </div>

              {saveError ? <ErrorMessage message={saveError} /> : null}
              {saveMessage ? <InlineAlert tone="success" title="Saved" message={saveMessage} /> : null}

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <Field label="Full name" htmlFor="patient-full-name" required className="md:col-span-2">
                  <TextInput
                    id="patient-full-name"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </Field>

                <Field label="Phone number" htmlFor="patient-phone-number">
                  <TextInput
                    id="patient-phone-number"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </Field>

                <Field label="Gender" htmlFor="patient-gender">
                  <Select id="patient-gender" name="gender" value={form.gender} onChange={handleChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>

                <Field label="Date of birth" htmlFor="patient-profile-dob">
                  <TextInput
                    id="patient-profile-dob"
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                    disabled={!data.patient}
                  />
                </Field>

                <Field
                  label="Address"
                  htmlFor="patient-address"
                  className="md:col-span-2"
                  hint={!data.patient ? 'Your patient record is missing, so date of birth and address cannot be edited from this screen yet.' : undefined}
                >
                  <Textarea
                    id="patient-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Your home address (optional)"
                    disabled={!data.patient}
                  />
                </Field>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" loading={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Card>
          </>
        ) : null}
      </div>
    </PageLayout>
  )
}
