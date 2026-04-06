import { useState } from 'react'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'
import TimePicker from '../../components/ui/TimePicker'
import { useAuth } from '../../hooks/useAuth.jsx'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m} ${ampm}`
}

export default function DoctorAvailability() {
  const { user } = useAuth()
  const [day, setDay] = useState('Monday')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const { data, loading, error, refetch } = useFetch(() =>
    user
      ? supabase
          .from('availability')
          .select('id, day, start_time, end_time')
          .eq('doctor_id', user.id)
          .order('start_time', { ascending: true })
          .then(r => {
            if (r.error) throw r.error
            return r.data
          })
      : Promise.resolve([])
  , [user?.id])

  async function handleAdd(e) {
    e.preventDefault()
    setAddError(null)

    const overlaps = (data ?? []).some(slot => {
      if (slot.day !== day) return false
      return startTime < slot.end_time && endTime > slot.start_time
    })

    if (overlaps) {
      setAddError("This slot overlaps with an existing one")
      return
    }

    if (endTime <= startTime) {
      setAddError('End time must be after start time')
      return
    }

    setAdding(true)
    try {
      const { error } = await supabase
        .from('availability')
        .insert({ doctor_id: user.id, day, start_time: startTime, end_time: endTime })
      if (error) throw error
      setStartTime('')
      setEndTime('')
      refetch()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', id)
      if (error) throw error
      refetch()
    } catch (err) {
      console.error(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const grouped = DAYS.reduce((acc, d) => {
    acc[d] = (data ?? []).filter(slot => slot.day === d)
    return acc
  }, {})

  return (
    <PageLayout>
      <h1 style={{ marginBottom: '0.5rem' }}>My Availability</h1>
      <p style={{ color: 'gray', marginBottom: '2rem', fontSize: 14 }}>
        Set your weekly availability so patients can book appointments with you.
      </p>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '2rem', maxWidth: 480 }}>
        <p style={{ fontWeight: 500, marginBottom: '1rem' }}>Add a slot</p>

        {addError && <ErrorMessage message={addError} />}

        <form onSubmit={handleAdd} style={{ marginTop: addError ? '1rem' : 0 }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: 13, color: 'gray', display: 'block', marginBottom: 4 }}>Day</label>
            <select
              value={day}
              onChange={e => setDay(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
            >
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
            <TimePicker label="End time" value={endTime} onChange={setEndTime} />
          </div>

          <button
            type="submit"
            disabled={adding}
            style={{ width: '100%', padding: '0.7rem', background: '#0e7fa8', color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', opacity: adding ? 0.7 : 1 }}
          >
            {adding ? 'Adding...' : 'Add slot'}
          </button>
        </form>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {DAYS.map(d => {
            const slots = grouped[d]
            if (!slots.length) return null
            return (
              <div key={d}>
                <p style={{ fontWeight: 500, fontSize: 14, marginBottom: '0.5rem', color: '#374151' }}>{d}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {slots.map(slot => (
                    <div
                      key={slot.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 1rem',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8
                      }}
                    >
                      <span style={{ fontSize: 14 }}>
                        {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                      </span>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        disabled={deletingId === slot.id}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          border: '1px solid #fecaca',
                          borderRadius: 6,
                          background: '#fee2e2',
                          color: '#b91c1c',
                          cursor: 'pointer',
                          opacity: deletingId === slot.id ? 0.6 : 1
                        }}
                      >
                        {deletingId === slot.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {DAYS.every(d => !grouped[d].length) && (
            <p style={{ color: 'gray', fontSize: 14 }}>No availability set yet. Add your first slot above.</p>
          )}
        </div>
      )}
    </PageLayout>
  )
}
