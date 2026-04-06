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
import TextInput from '../../components/ui/TextInput'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function DoctorProfile() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    specialization: '',
    licenseNo: '',
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { data: profileData, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return null

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') throw profileError

    const { data: doctorRow, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', user.id)
      .single()

    if (doctorError && doctorError.code !== 'PGRST116') throw doctorError

    return {
      profile: profileRow || {},
      doctor: doctorRow || {},
    }
  }, [user?.id], { key: `doctor-profile:${user?.id ?? 'anonymous'}` })

  useEffect(() => {
    if (!profileData) return

    setFormData({
      fullName: profileData.profile?.full_name || '',
      email: user?.email || '',
      specialization: profileData.doctor?.specialization || '',
      licenseNo: profileData.doctor?.license_no || '',
    })
  }, [profileData, user?.email])

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormData(current => ({ ...current, [name]: value }))
  }

  async function handleSaveProfile(event) {
    event.preventDefault()
    setSaveError('')
    setSuccessMessage('')
    setSaveLoading(true)

    try {
      if (!formData.specialization.trim()) throw new Error('Specialization is required.')
      if (!formData.licenseNo.trim()) throw new Error('License number is required.')

      if (formData.fullName.trim()) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: formData.fullName })
          .eq('id', user.id)

        if (profileError) throw profileError
      }

      const { error: doctorError } = await supabase
        .from('doctors')
        .update({
          specialization: formData.specialization,
          license_no: formData.licenseNo,
        })
        .eq('id', user.id)

      if (doctorError) throw doctorError

      setSuccessMessage('Profile updated successfully.')
      await refetch()
    } catch (requestError) {
      setSaveError(requestError.message || 'Failed to save profile')
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner message="Loading profile..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <SectionHeader
          title="Doctor profile"
          description="Review your doctor identity, credentials, and account details in one place."
        />

        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {profileData ? (
          <>
            <Card className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Profile overview
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  {formData.fullName || 'Doctor'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{formData.email}</p>
              </div>

              <DataPairs
                items={[
                  { label: 'Specialization', value: formData.specialization || 'Not provided' },
                  { label: 'License number', value: formData.licenseNo || 'Not provided' },
                  { label: 'Status', value: 'Active' },
                ]}
              />
            </Card>

            <Card className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Edit profile
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Update credentials</h3>
              </div>

              {saveError ? <ErrorMessage message={saveError} /> : null}
              {successMessage ? <InlineAlert tone="success" title="Saved" message={successMessage} /> : null}

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveProfile}>
                <Field label="Full name" htmlFor="doctor-full-name" className="md:col-span-2">
                  <TextInput
                    id="doctor-full-name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                  />
                </Field>

                <Field label="Email" htmlFor="doctor-email">
                  <TextInput
                    id="doctor-email"
                    value={formData.email}
                    readOnly
                  />
                </Field>

                <Field label="Specialization" htmlFor="doctor-specialization" required>
                  <TextInput
                    id="doctor-specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g. Cardiology"
                    required
                  />
                </Field>

                <Field label="License number" htmlFor="doctor-license" required>
                  <TextInput
                    id="doctor-license"
                    name="licenseNo"
                    value={formData.licenseNo}
                    onChange={handleInputChange}
                    placeholder="e.g. MCI-12345"
                    required
                  />
                </Field>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" loading={saveLoading}>
                    {saveLoading ? 'Saving...' : 'Save changes'}
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
