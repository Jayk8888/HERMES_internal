import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'

export default function DoctorAppointmentDetail() {
  const { id } = useParams()
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [creatingRecord, setCreatingRecord] = useState(false)
  const [recordForm, setRecordForm] = useState({ description: '', prescription: '', vitals: '' })
  const [medicalRecord, setMedicalRecord] = useState(null)

  const { data: appt, loading, error, refetch } = useFetch(async () => {
    // Fetch appointment
    const { data: appointmentData, error: apptError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          profiles (
            full_name,
            email,
            role
          ),
          dob
        )
      `)
      .eq('id', id)
      .single()

    if (apptError) throw apptError

    // Fetch medical record
    const { data: recordData, error: recordError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('appointment_id', id)
      .maybeSingle()

    if (recordError && recordError.code !== 'PGRST116') {
      throw recordError
    }

    setMedicalRecord(recordData || null)
    return appointmentData
  }, [id])

  async function handleStatusChange(newStatus) {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return
    setUpdatingStatus(true)
    try {
      const { error } = await supabase.rpc('update_appointment_status', {
        p_appointment_id: id,
        p_status: newStatus
      })
      if (error) throw error
      refetch()
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleCreateRecord(e) {
    e.preventDefault()
    setCreatingRecord(true)
    try {
      let vitalsObj = null
      if (recordForm.vitals) {
        try {
          vitalsObj = JSON.parse(recordForm.vitals)
        } catch (err) {
          throw new Error('Vitals must be valid JSON format')
        }
      }

      const { data: newRecord, error } = await supabase
        .from('medical_records')
        .insert({
          appointment_id: id,
          description: recordForm.description,
          prescription: recordForm.prescription || null,
          vitals: vitalsObj
        })
        .select()
        .single()

      if (error) throw error
      setMedicalRecord(newRecord)
    } catch (err) {
      alert(`Failed to create medical record: ${err.message}`)
    } finally {
      setCreatingRecord(false)
    }
  }

  return (
    <PageLayout>
      <Link to="/doctor/appointments" style={{ textDecoration: 'none', color: '#0066cc' }}>&larr; Back to Appointments</Link>
      <h1 style={{ marginTop: '1rem' }}>Appointment Detail</h1>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : !appt ? (
        <p>Appointment not found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '2rem', marginTop: '1rem' }}>
          <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> {appt.patients?.profiles?.full_name}</p>
            <p><strong>Email:</strong> {appt.patients?.profiles?.email}</p>
            <p><strong>DOB:</strong> {appt.patients?.dob}</p>

            <h3 style={{ marginTop: '1.5rem' }}>Appointment Details</h3>
            <p><strong>Date & Time:</strong> {new Date(appt.scheduled_at).toLocaleString()}</p>
            <p><strong>Current Status:</strong> {appt.status}</p>

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

          <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Medical Record</h3>
            {medicalRecord ? (
              <div style={{ marginTop: '1rem' }}>
                <p>Record exists for this appointment.</p>
                <Link to={`/doctor/records/${medicalRecord.id}`} style={{ display: 'inline-block', marginTop: '0.5rem', textDecoration: 'none', color: '#0066cc', fontWeight: 'bold' }}>
                  View / Edit Medical Record &rarr;
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <p>No medical record exists yet. Create one below:</p>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Description / Notes</label>
                  <textarea
                    style={{ width: '100%', padding: '0.5rem' }}
                    rows={4}
                    required
                    value={recordForm.description}
                    onChange={e => setRecordForm({ ...recordForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Prescription</label>
                  <textarea
                    style={{ width: '100%', padding: '0.5rem' }}
                    rows={2}
                    value={recordForm.prescription}
                    onChange={e => setRecordForm({ ...recordForm, prescription: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Vitals (JSON format e.g. {"{\"bp\":\"120/80\"}"})</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={recordForm.vitals}
                    placeholder='{"bp":"120/80"}'
                    onChange={e => setRecordForm({ ...recordForm, vitals: e.target.value })}
                  />
                </div>
                <button type="submit" disabled={creatingRecord} style={{ alignSelf: 'flex-start', padding: '0.5rem 1.5rem', cursor: 'pointer', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px' }}>
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
