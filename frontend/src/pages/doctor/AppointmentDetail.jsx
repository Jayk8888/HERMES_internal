import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'

const VITAL_FIELDS = [
  { key: 'blood_pressure', label: 'Blood Pressure', placeholder: 'e.g. 120/80 mmHg' },
  { key: 'heart_rate', label: 'Heart Rate', placeholder: 'e.g. 72 bpm' },
  { key: 'temperature', label: 'Temperature', placeholder: 'e.g. 98.6 °F' },
  { key: 'oxygen_saturation', label: 'Oxygen Saturation', placeholder: 'e.g. 98%' },
  { key: 'weight', label: 'Weight', placeholder: 'e.g. 70 kg' },
  { key: 'height', label: 'Height', placeholder: 'e.g. 175 cm' },
  { key: 'respiratory_rate', label: 'Respiratory Rate', placeholder: 'e.g. 16 breaths/min' },
]

export default function DoctorAppointmentDetail() {
  const { id } = useParams()
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [creatingRecord, setCreatingRecord] = useState(false)
  const [recordForm, setRecordForm] = useState({
    description: '',
    prescription: '',
    vitals: Object.fromEntries(VITAL_FIELDS.map(f => [f.key, '']))
  })
  const [medicalRecord, setMedicalRecord] = useState(null)
  const [statusError, setStatusError] = useState(null)
  const [recordError, setRecordError] = useState(null)

  const { data: appt, loading, error, refetch } = useFetch(async () => {
    const { data: appointmentData, error: apptError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          profiles (full_name, email, role),
          dob
        )
      `)
      .eq('id', id)
      .single()

    if (apptError) throw apptError

    const { data: recordData, error: recordError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('appointment_id', id)
      .maybeSingle()

    if (recordError && recordError.code !== 'PGRST116') throw recordError

    setMedicalRecord(recordData || null)
    return appointmentData
  }, [id])

  async function handleStatusChange(newStatus) {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return
    setUpdatingStatus(true)
    setStatusError(null)
    try {
      const { error } = await supabase.rpc('update_appointment_status', {
        appointment_id: id,
        new_status: newStatus
      })
      if (error) throw error
      refetch()
    } catch (err) {
      setStatusError(err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleCreateRecord(e) {
    e.preventDefault()
    setCreatingRecord(true)
    setRecordError(null)
    try {
      const vitalsObj = Object.fromEntries(
        Object.entries(recordForm.vitals).filter(([_, v]) => v.trim() !== '')
      )

      const { data: newRecord, error } = await supabase
        .from('medical_records')
        .insert({
          appointment_id: id,
          description: recordForm.description,
          prescription: recordForm.prescription || null,
          vitals: Object.keys(vitalsObj).length > 0 ? vitalsObj : null
        })
        .select()
        .single()

      if (error) throw error
      setMedicalRecord(newRecord)
    } catch (err) {
      setRecordError(err.message)
    } finally {
      setCreatingRecord(false)
    }
  }

  return (
    <PageLayout>
      <Link to="/doctor/appointments" style={{ textDecoration: 'none', color: '#0066cc' }}>
        ← Back to Appointments
      </Link>
      <h1 style={{ marginTop: '1rem' }}>Appointment Detail</h1>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : !appt ? (
        <p>Appointment not found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '2rem', marginTop: '1rem' }}>

          <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: 8 }}>
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> {Array.isArray(appt.patients?.profiles) ? appt.patients?.profiles[0]?.full_name : appt.patients?.profiles?.full_name}</p>
            <p><strong>Email:</strong> {Array.isArray(appt.patients?.profiles) ? appt.patients?.profiles[0]?.email : appt.patients?.profiles?.email}</p>
            <p><strong>DOB:</strong> {appt.patients?.dob}</p>

            <h3 style={{ marginTop: '1.5rem' }}>Appointment Details</h3>
            <p><strong>Date & Time:</strong> {new Date(appt.scheduled_at).toLocaleString()}</p>
            <p><strong>Current Status:</strong> {appt.status}</p>

            {statusError && (
              <p style={{ color: 'red', marginTop: '0.5rem', fontSize: 14 }}>⚠ {statusError}</p>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={updatingStatus || appt.status === 'scheduled'}
                onClick={() => handleStatusChange('scheduled')}
                style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
              >
                Mark Scheduled
              </button>
              <button
                disabled={updatingStatus || appt.status === 'completed'}
                onClick={() => handleStatusChange('completed')}
                style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
              >
                Mark Completed
              </button>
              <button
                disabled={updatingStatus || appt.status === 'cancelled'}
                onClick={() => handleStatusChange('cancelled')}
                style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
              >
                Cancel Appointment
              </button>
            </div>
          </div>

          <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: 8 }}>
            <h3>Medical Record</h3>
            {medicalRecord ? (
              <div style={{ marginTop: '1rem' }}>
                <p>Record exists for this appointment.</p>
                <Link
                  to={`/doctor/records/${medicalRecord.id}`}
                  style={{ display: 'inline-block', marginTop: '0.5rem', textDecoration: 'none', color: '#0066cc', fontWeight: 'bold' }}
                >
                  View / Edit Medical Record →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <p style={{ color: 'gray', fontSize: 14 }}>No medical record exists yet. Create one below:</p>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                    Description / Notes
                  </label>
                  <textarea
                    style={{ width: '100%', padding: '0.5rem' }}
                    rows={4}
                    required
                    value={recordForm.description}
                    onChange={e => setRecordForm({ ...recordForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                    Prescription
                  </label>
                  <textarea
                    style={{ width: '100%', padding: '0.5rem' }}
                    rows={2}
                    value={recordForm.prescription}
                    onChange={e => setRecordForm({ ...recordForm, prescription: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                    Vitals <span style={{ fontWeight: 400, color: 'gray', fontSize: 13 }}>(optional — leave blank to skip)</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {VITAL_FIELDS.map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', fontSize: 13, color: 'gray', marginBottom: 4 }}>
                          {field.label}
                        </label>
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={recordForm.vitals[field.key]}
                          onChange={e => setRecordForm({
                            ...recordForm,
                            vitals: { ...recordForm.vitals, [field.key]: e.target.value }
                          })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {recordError && (
                  <p style={{ color: 'red', fontSize: 14 }}>⚠ {recordError}</p>
                )}

                <button
                  type="submit"
                  disabled={creatingRecord}
                  style={{
                    alignSelf: 'flex-start', padding: '0.5rem 1.5rem',
                    cursor: 'pointer', background: '#0066cc', color: 'white',
                    border: 'none', borderRadius: 4
                  }}
                >
                  {creatingRecord ? 'Creating...' : 'Create Record'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
