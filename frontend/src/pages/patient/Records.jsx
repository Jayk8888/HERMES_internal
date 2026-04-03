import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import SectionHeader from '../../components/ui/SectionHeader'
import Select from '../../components/ui/Select'
import StatusBadge from '../../components/ui/StatusBadge'
import TextInput from '../../components/ui/TextInput'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth.jsx'
import { pickFirst } from '../../lib/data'
import { formatDate, formatDateTime } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

const CHIP_TONES = {
  info: 'border border-info/15 bg-info-light text-info-dark',
  success: 'border border-success/15 bg-success-light text-success-dark',
  neutral: 'border border-slate-200 bg-slate-50 text-slate-600',
  brand: 'border border-primary-100 bg-primary-50 text-primary-700',
}

function hasContent(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

function countVitals(vitals) {
  if (!vitals || typeof vitals !== 'object') return 0
  return Object.values(vitals).filter(Boolean).length
}

function formatCount(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`
}

function formatStatusLabel(value) {
  if (!value) return 'Unknown'
  return value.replaceAll('_', ' ')
}

function getStatusChipTone(status) {
  if (status === 'completed') return 'success'
  if (status === 'scheduled') return 'info'
  return 'neutral'
}

function truncatePreview(value, limit = 180) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) return 'No clinical summary available'
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit).trimEnd()}…`
}

function getRecordFlags(record) {
  return {
    hasPrescription: hasContent(record.prescription),
    vitalsCount: countVitals(record.vitals),
  }
}

function buildRecordSearchText(record) {
  const appointment = pickFirst(record.appointment)
  const doctor = pickFirst(appointment?.doctor)
  const doctorProfile = pickFirst(doctor?.profiles)

  return [
    doctorProfile?.full_name,
    doctor?.specialization,
    record.description,
    record.prescription,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function groupRecordsByMonth(records) {
  const groups = []
  const grouped = new Map()

  for (const record of records) {
    const date = new Date(record.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!grouped.has(monthKey)) {
      const nextGroup = {
        key: monthKey,
        label: formatDate(record.created_at, { month: 'long', year: 'numeric' }),
        records: [],
      }

      grouped.set(monthKey, nextGroup)
      groups.push(nextGroup)
    }

    grouped.get(monthKey).records.push(record)
  }

  return groups
}

function SummaryChip({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${CHIP_TONES[tone] ?? CHIP_TONES.neutral}`}>
      {children}
    </span>
  )
}

export default function PatientRecords() {
  const { user, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [prescriptionFilter, setPrescriptionFilter] = useState('all')

  const { data, loading, error, refetch } = useFetch(() =>
    user
      ? supabase
          .from('medical_records')
          .select(`
            id,
            description,
            prescription,
            vitals,
            created_at,
            appointment:appointments!inner(
              id,
              doctor_id,
              scheduled_at,
              status,
              doctor:doctors!appointments_doctor_id_fkey(
                specialization,
                profiles (full_name)
              )
            )
          `)
          .order('created_at', { ascending: false })
          .then(response => {
            if (response.error) throw response.error
            return response.data ?? []
          })
      : Promise.resolve([])
  , [user?.id], { key: `patient-records:${user?.id ?? 'anonymous'}` })

  const records = data ?? []
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  let filteredRecords = records

  if (normalizedSearchTerm) {
    filteredRecords = filteredRecords.filter(record => buildRecordSearchText(record).includes(normalizedSearchTerm))
  }

  if (prescriptionFilter === 'with') {
    filteredRecords = filteredRecords.filter(record => getRecordFlags(record).hasPrescription)
  }

  if (prescriptionFilter === 'without') {
    filteredRecords = filteredRecords.filter(record => !getRecordFlags(record).hasPrescription)
  }

  const groupedRecords = groupRecordsByMonth(filteredRecords)
  const hasActiveFilters = normalizedSearchTerm.length > 0 || prescriptionFilter !== 'all'

  function clearFilters() {
    setSearchTerm('')
    setPrescriptionFilter('all')
  }

  if (authLoading) {
    return (
      <PageLayout>
        <LoadingSpinner message="Loading your records..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <SectionHeader
          title="Medical records"
          description="Browse your visit history by month, then open any record for complete notes, prescriptions, and vitals."
        />

        {loading ? <LoadingSpinner message="Loading your records..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {!loading && !error && records.length === 0 ? (
          <EmptyState
            icon="R"
            title="No medical records yet"
            description="Records will appear here after a doctor completes an appointment and adds clinical notes."
            action={(
              <Button as={Link} to="/patient/appointments">
                View appointments
              </Button>
            )}
          />
        ) : null}

        {!loading && !error && records.length > 0 ? (
          <>
            <Card tone="subtle" className="space-y-4 border-dashed">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Find a visit</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">Search and filter your medical history</h3>
                </div>
                <p className="text-sm text-slate-500">
                  Showing {filteredRecords.length} of {records.length} {records.length === 1 ? 'record' : 'records'}
                </p>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_14rem_auto]">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Search records
                  </span>
                  <TextInput
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    placeholder="Search doctor, specialization, or note text"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Prescription
                  </span>
                  <Select value={prescriptionFilter} onChange={event => setPrescriptionFilter(event.target.value)}>
                    <option value="all">All records</option>
                    <option value="with">With prescription</option>
                    <option value="without">Without prescription</option>
                  </Select>
                </label>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full xl:w-auto"
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            </Card>

            {filteredRecords.length === 0 ? (
              <EmptyState
                icon="F"
                title="No records match these filters"
                description="You have medical records, but none match your current search or filter settings."
                action={(
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              />
            ) : (
              <div className="space-y-8">
                {groupedRecords.map(group => (
                  <section key={group.key} className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Visit history</p>
                        <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-900">
                          {group.label}
                        </h3>
                      </div>
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
                        {formatCount(group.records.length, 'record')}
                      </div>
                    </div>

                    <div className="relative pl-5 sm:pl-7">
                      <div className="absolute bottom-0 left-2 top-0 w-px bg-gradient-to-b from-primary-200 via-primary-300/70 to-transparent" />

                      <div className="space-y-4">
                        {group.records.map(record => {
                          const appointment = pickFirst(record.appointment)
                          const doctor = pickFirst(appointment?.doctor)
                          const doctorProfile = pickFirst(doctor?.profiles)
                          const visitDate = appointment?.scheduled_at || record.created_at
                          const { hasPrescription, vitalsCount } = getRecordFlags(record)
                          const summaryChips = []

                          if (hasPrescription) summaryChips.push({ label: 'Prescription added', tone: 'brand' })
                          if (vitalsCount > 0) summaryChips.push({ label: `${formatCount(vitalsCount, 'vital')} recorded`, tone: 'info' })
                          if (appointment?.status && appointment.status !== 'completed') summaryChips.push({
                            label: `${formatStatusLabel(appointment.status)} visit`,
                            tone: getStatusChipTone(appointment.status),
                          })

                          return (
                            <div key={record.id} className="relative">
                              <Card interactive className="ml-4 space-y-4 sm:ml-6">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                  <div className="min-w-0">
                                    <h4 className="font-display text-xl font-semibold tracking-tight text-slate-900">
                                      Dr. {doctorProfile?.full_name || 'Doctor'}
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-500">
                                      {doctor?.specialization || 'Specialization not available'}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-400">
                                      Record created {formatDateTime(record.created_at)}
                                    </p>
                                  </div>

                                  <div className="flex flex-col gap-3 xl:items-end">
                                    {appointment?.status && appointment.status !== 'completed' ? (
                                      <div className="self-start xl:self-auto">
                                        <StatusBadge status={appointment.status} />
                                      </div>
                                    ) : null}

                                    <div className="min-w-[10rem] xl:text-right">
                                      <p className="text-base font-semibold text-slate-900">
                                        {formatDate(visitDate, { weekday: 'short', day: 'numeric', month: 'short' })}
                                      </p>
                                      <p className="mt-1 text-sm text-slate-500">
                                        {formatDateTime(visitDate, { hour: 'numeric', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {summaryChips.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {summaryChips.map(chip => (
                                      <SummaryChip key={chip.label} tone={chip.tone}>
                                        {chip.label}
                                      </SummaryChip>
                                    ))}
                                  </div>
                                ) : null}

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                  <p
                                    className="flex-1 text-sm leading-relaxed text-slate-600"
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {truncatePreview(record.description)}
                                  </p>

                                  <Button
                                    as={Link}
                                    to={`/patient/records/${record.id}`}
                                    variant="primary"
                                    size="medium"
                                    className="w-full shrink-0 sm:w-auto"
                                  >
                                    View full record
                                  </Button>
                                </div>
                              </Card>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </PageLayout>
  )
}
