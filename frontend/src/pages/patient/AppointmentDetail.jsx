import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'
import { useState } from 'react'

export default function PatientAppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)

  const { data, loading, error, refetch } = useFetch(() =>
    supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        doctor:doctor_id (
          id,
          specialization,
          license_no,
          profiles (full_name, email)
        )
      `)
      .eq('id', id)
      .single()
      .then(r => {
        if (r.error) throw r.error
        return r.data
      })
  , [id])

  async function handleCancel() {
    setCancelError(null)
    setCancelling(true)
    try {
      const { error } = await supabase.rpc('update_appointment_status', {
        appointment_id: id,
        new_status: 'cancelled'
      })
      if (error) throw error
      refetch()
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <PageLayout>
      <button
        onClick={() => navigate('/patient/appointments')}
        style={{ marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'gray', padding: 0 }}
      >
        ← Back to appointments
      </button>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {data && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1>Appointment Details</h1>
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              padding: '4px 12px',
              borderRadius: 20,
              textTransform: 'capitalize',
              background: data.status === 'scheduled' ? '#e0f2fe' : data.status === 'completed' ? '#dcfce7' : '#fee2e2',
              color: data.status === 'scheduled' ? '#0369a1' : data.status === 'completed' ? '#15803d' : '#b91c1c'
            }}>
              {data.status}
            </span>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: 13, color: 'gray', marginBottom: 4 }}>Doctor</p>
            <p style={{ fontWeight: 500, marginBottom: 2 }}>Dr. {data.doctor?.profiles?.full_name}</p>
            <p style={{ fontSize: 14, color: 'gray' }}>{data.doctor?.specialization}</p>
            <p style={{ fontSize: 13, color: 'gray', marginTop: 2 }}>License: {data.doctor?.license_no}</p>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 13, color: 'gray', marginBottom: 4 }}>Scheduled at</p>
            <p style={{ fontWeight: 500 }}>{new Date(data.scheduled_at).toLocaleString()}</p>
          </div>

          {cancelError && <ErrorMessage message={cancelError} />}

          {data.status === 'scheduled' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                padding: '0.7rem 1.5rem',
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel appointment'}
            </button>
          )}
        </div>
      )}
    </PageLayout>
  )
}
