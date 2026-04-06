import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'

const VITAL_LABELS = {
  blood_pressure: 'Blood Pressure',
  heart_rate: 'Heart Rate',
  temperature: 'Temperature',
  oxygen_saturation: 'Oxygen Saturation',
  weight: 'Weight',
  height: 'Height',
  respiratory_rate: 'Respiratory Rate'
}

export default function PatientRecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, loading, error, refetch } = useFetch(() =>
    supabase
      .from('medical_records')
      .select(`
        id,
        description,
        prescription,
        vitals,
        created_at,
        appointment:appointment_id (
          scheduled_at,
          doctor:doctor_id (
            specialization,
            profiles (full_name)
          )
        )
      `)
      .eq('id', id)
      .single()
      .then(r => {
        if (r.error) throw r.error
        return r.data
      })
  , [id])

  return (
    <PageLayout>
      <button
        onClick={() => navigate('/patient/records')}
        style={{ marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'gray', padding: 0 }}
      >
        ← Back to records
      </button>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {data && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
            <h1>Medical Record</h1>
            <p style={{ fontSize: 13, color: 'gray' }}>
              {new Date(data.created_at).toLocaleDateString()}
            </p>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: 13, color: 'gray', marginBottom: 4 }}>Doctor</p>
            <p style={{ fontWeight: 500 }}>Dr. {data.appointment?.doctor?.profiles?.full_name}</p>
            <p style={{ fontSize: 14, color: 'gray' }}>{data.appointment?.doctor?.specialization}</p>
            <p style={{ fontSize: 13, color: 'gray', marginTop: 4 }}>
              Appointment on {new Date(data.appointment?.scheduled_at).toLocaleDateString()}
            </p>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: 13, color: 'gray', marginBottom: 6 }}>Description</p>
            <p style={{ lineHeight: 1.7 }}>{data.description}</p>
          </div>

          {data.prescription && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: 13, color: 'gray', marginBottom: 6 }}>Prescription</p>
              <p style={{ lineHeight: 1.7 }}>{data.prescription}</p>
            </div>
          )}

          {data.vitals && Object.keys(data.vitals).length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
              <p style={{ fontSize: 13, color: 'gray', marginBottom: 12 }}>Vitals</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {Object.entries(data.vitals).map(([key, value]) => (
                  <div key={key} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: 8 }}>
                    <p style={{ fontSize: 12, color: 'gray', marginBottom: 2 }}>
                      {VITAL_LABELS[key] ?? key}
                    </p>
                    <p style={{ fontWeight: 500 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
