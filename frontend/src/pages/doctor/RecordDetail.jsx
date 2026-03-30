import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'

export default function DoctorRecordDetail() {
  const { id } = useParams()
  const [updatingRecord, setUpdatingRecord] = useState(false)
  const [recordForm, setRecordForm] = useState({ description: '', prescription: '', vitals: '' })

  const { data: record, loading, error, refetch } = useFetch(async () => {
    const { data, error: fetchErr } = await supabase
      .from('medical_records')
      .select(`
        *,
        appointments (
          id,
          scheduled_at,
          status,
          patients (
            profiles (
              full_name
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (fetchErr) throw fetchErr

    // Initialize form
    setRecordForm({
      description: data.description || '',
      prescription: data.prescription || '',
      vitals: data.vitals ? JSON.stringify(data.vitals) : ''
    })

    return data
  }, [id])

  async function handleUpdateRecord(e) {
    e.preventDefault()
    setUpdatingRecord(true)
    try {
      let vitalsObj = null
      if (recordForm.vitals) {
        try {
          vitalsObj = JSON.parse(recordForm.vitals)
        } catch (err) {
          throw new Error('Vitals must be valid JSON format')
        }
      }

      const { error } = await supabase
        .from('medical_records')
        .update({
          description: recordForm.description,
          prescription: recordForm.prescription || null,
          vitals: vitalsObj
        })
        .eq('id', id)

      if (error) throw error
      alert('Medical record updated successfully')
      refetch()
    } catch (err) {
      alert(`Failed to update medical record: ${err.message}`)
    } finally {
      setUpdatingRecord(false)
    }
  }

  return (
    <PageLayout>
      {record?.appointment_id && (
        <Link to={`/doctor/appointments/${record.appointment_id}`} style={{ textDecoration: 'none', color: '#0066cc' }}>
          &larr; Back to Appointment
        </Link>
      )}
      <h1 style={{ marginTop: '1rem' }}>Medical Record Details</h1>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : !record ? (
        <p>Record not found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '2rem', marginTop: '1rem' }}>
          <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Related Appointment</h3>
            <p><strong>Patient:</strong> {record.appointments?.patients?.profiles?.full_name}</p>
            <p><strong>Date:</strong> {new Date(record.appointments?.scheduled_at).toLocaleString()}</p>
            <p><strong>Status:</strong> {record.appointments?.status}</p>
            <p><strong>Record Created:</strong> {new Date(record.created_at).toLocaleString()}</p>
          </div>

          <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Edit Record</h3>
            <form onSubmit={handleUpdateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
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
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Vitals (JSON format)</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={recordForm.vitals}
                  placeholder='{"bp":"120/80"}'
                  onChange={e => setRecordForm({ ...recordForm, vitals: e.target.value })}
                />
              </div>
              <button type="submit" disabled={updatingRecord} style={{ alignSelf: 'flex-start', padding: '0.5rem 1.5rem', cursor: 'pointer', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px' }}>
                {updatingRecord ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
