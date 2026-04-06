import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import SectionHeader from '../../components/ui/SectionHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import TextInput from '../../components/ui/TextInput'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { getAge } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

export default function DoctorPatients() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: patients, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return []

    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        status,
        scheduled_at,
        patients (
          id,
          dob,
          profiles (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('doctor_id', user.id)
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: false })

    if (fetchError) throw fetchError

    const uniquePatients = new Map()

    for (const appointment of appointments || []) {
      if (!uniquePatients.has(appointment.patient_id)) {
        uniquePatients.set(appointment.patient_id, {
          id: appointment.patients?.id ?? appointment.patient_id,
          profile: appointment.patients?.profiles,
          patient: { dob: appointment.patients?.dob },
          lastAppointment: appointment.scheduled_at,
          appointmentStatus: appointment.status,
        })
      }
    }

    return [...uniquePatients.values()]
  }, [user?.id], { key: `doctor-patients:${user?.id ?? 'anonymous'}` })

  const filteredPatients = patients?.filter(patient =>
    patient.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner message="Loading patients..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <SectionHeader
          title="Patients"
          description="Browse patients linked to your non-cancelled appointment history and move directly into their shared record history."
        />

        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        <Card className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput
              type="search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search by name or email..."
              className="pl-10"
            />
          </div>
          <p className="text-sm text-slate-500">
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
            {searchTerm ? ` matching “${searchTerm}”` : ''}
          </p>
        </Card>

        {filteredPatients.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title={patients?.length === 0 ? 'No patients found' : 'No patients match your search'}
            description={patients?.length === 0
              ? 'You will see patients here once they start booking appointments with you.'
              : 'Try a different patient name or email address.'}
          />
        ) : (
          <div className="grid gap-4">
            {filteredPatients.map(patient => (
              <Card
                key={patient.id}
                as={Link}
                to={`/doctor/patients/${patient.id}`}
                interactive
                className="no-underline"
              >
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-center">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {patient.profile?.full_name || 'Unknown'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {patient.profile?.email || 'No email available'}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-500">
                    <p>{patient.patient?.dob ? `${getAge(patient.patient.dob)} years` : 'Age not available'}</p>
                    <p>Last appointment: {new Date(patient.lastAppointment).toLocaleDateString('en-IN')}</p>
                  </div>

                  <div className="lg:justify-self-end">
                    <StatusBadge status={patient.appointmentStatus} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
