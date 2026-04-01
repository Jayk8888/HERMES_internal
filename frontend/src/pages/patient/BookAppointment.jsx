import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAYS_JS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m} ${ampm}`
}

function getProfileName(profiles) {
  if (!profiles) return 'Unknown'
  if (Array.isArray(profiles)) return profiles[0]?.full_name ?? 'Unknown'
  return profiles.full_name ?? 'Unknown'
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function CalendarPicker({ availability, existingAppointments, selectedDate, onSelect }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const availableDays = new Set((availability || []).map(s => s.day))

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const bookedDates = new Set(
    (existingAppointments || []).map(a => {
      const d = new Date(a.scheduled_at)
      return toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
    })
  )

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#0369a1' }}>‹</button>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#0369a1' }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 12, color: 'gray', fontWeight: 500, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const dateStr = toDateStr(viewYear, viewMonth, day)
          const jsDay = new Date(viewYear, viewMonth, day).getDay()
          const dayName = DAYS_JS[jsDay]
          const isAvailable = availableDays.has(dayName)
          const isPast = new Date(dateStr) < new Date(today.toDateString())
          const isBooked = bookedDates.has(dateStr)
          const isSelected = selectedDate === dateStr
          const isToday = dateStr === toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
          const isSelectable = isAvailable && !isPast && !isBooked

          return (
            <div
              key={day}
              onClick={() => isSelectable && onSelect(dateStr)}
              style={{
                textAlign: 'center',
                padding: '8px 4px',
                borderRadius: 8,
                fontSize: 14,
                cursor: isSelectable ? 'pointer' : 'default',
                fontWeight: isToday ? 700 : 400,
                background: isSelected
                  ? '#0369a1'
                  : isAvailable && !isPast && !isBooked
                    ? '#e0f2fe'
                    : 'transparent',
                color: isSelected
                  ? 'white'
                  : isPast || !isAvailable || isBooked
                    ? '#d1d5db'
                    : '#0369a1',
                border: isToday && !isSelected ? '1px solid #0369a1' : '1px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: 12, color: 'gray' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: '#e0f2fe', display: 'inline-block' }} />
          Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: '#0369a1', display: 'inline-block' }} />
          Selected
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f3f4f6', display: 'inline-block' }} />
          Unavailable
        </span>
      </div>
    </div>
  )
}

export default function PatientBookAppointment() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookedAppointment, setBookedAppointment] = useState(null)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState(null)

  const { data: doctors, loading, error, refetch } = useFetch(async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select(`id, specialization, license_no, profiles (full_name, email)`)
    if (error) throw error
    return (data || []).sort((a, b) =>
      getProfileName(a.profiles).localeCompare(getProfileName(b.profiles))
    )
  })

  const { data: availability, loading: availabilityLoading } = useFetch(async () => {
    if (!selectedDoctor) return []
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('doctor_id', selectedDoctor)
    if (error) throw error
    return data || []
  }, [selectedDoctor])

  const { data: existingAppointments } = useFetch(async () => {
    if (!selectedDoctor) return []
    const { data, error } = await supabase
      .from('appointments')
      .select('scheduled_at')
      .eq('doctor_id', selectedDoctor)
      .eq('status', 'scheduled')
    if (error) throw error
    return data || []
  }, [selectedDoctor])

  const selectedDayName = selectedDate ? DAYS_JS[new Date(selectedDate).getDay()] : null
  const slotsForDay = availability
    ? availability.filter(s => s.day === selectedDayName)
    : []

  function isSlotBooked(slot, dateStr) {
    if (!existingAppointments || !dateStr) return false
    return existingAppointments.some(appt => {
      const d = new Date(appt.scheduled_at)
      const apptDate = toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
      const apptTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      return apptDate === dateStr && apptTime >= slot.start_time && apptTime < slot.end_time
    })
  }

  async function handleBookAppointment() {
    if (!user?.id || !selectedDoctor || !selectedDate || !selectedSlot) {
      setBookingError('Please select a doctor, date and time slot')
      return
    }

    setIsBooking(true)
    setBookingError(null)

    try {
      const [startH, startM] = selectedSlot.start_time.split(':')
      const appointmentDate = new Date(selectedDate)
      appointmentDate.setHours(parseInt(startH), parseInt(startM), 0, 0)

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: user.id,
          doctor_id: selectedDoctor,
          scheduled_at: appointmentDate.toISOString(),
          status: 'scheduled'
        }])
        .select()

      if (error) throw error

      setBookedAppointment(data?.[0])
      setSelectedDoctor(null)
      setSelectedDate('')
      setSelectedSlot(null)
    } catch (err) {
      setBookingError(err.message || 'Failed to book appointment')
    } finally {
      setIsBooking(false)
    }
  }

  if (authLoading) return <PageLayout><LoadingSpinner /></PageLayout>

  return (
    <PageLayout>
      <div style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Book an Appointment</h1>
          <p style={{ color: 'gray' }}>Select a doctor and available time slot</p>
        </div>

        {bookedAppointment && (
          <div style={{ padding: '1.25rem', borderRadius: 12, background: '#dcfce7', border: '1px solid #86efac', marginBottom: '2rem' }}>
            <p style={{ color: '#15803d', fontWeight: 500, marginBottom: '0.5rem' }}>✓ Appointment booked successfully!</p>
            <p style={{ color: '#15803d', fontSize: 14, marginBottom: '1rem' }}>Your appointment has been scheduled.</p>
            <button onClick={() => navigate('/patient/appointments')} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#15803d', color: 'white', cursor: 'pointer', fontSize: 14 }}>
              View Your Appointments
            </button>
          </div>
        )}

        {/* Step 1 */}
        <div style={{ padding: '1.5rem', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: '1.5rem', background: 'white' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: 16, fontWeight: 600 }}>Step 1: Select a Doctor</h2>
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} onRetry={refetch} />}
          {!loading && !error && doctors && (
            <div style={{ display: 'grid', gap: '0.75rem', maxHeight: 400, overflowY: 'auto' }}>
              {doctors.map(doctor => (
                <div
                  key={doctor.id}
                  onClick={() => { setSelectedDoctor(doctor.id); setSelectedDate(''); setSelectedSlot(null) }}
                  style={{
                    padding: '1rem', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                    border: selectedDoctor === doctor.id ? '2px solid #0369a1' : '1px solid #e5e7eb',
                    background: selectedDoctor === doctor.id ? '#f0f9ff' : 'white'
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Dr. {getProfileName(doctor.profiles)}</p>
                  <p style={{ fontSize: 14, color: 'gray', marginBottom: '0.25rem' }}>{doctor.specialization}</p>
                  <p style={{ fontSize: 12, color: '#666' }}>License: {doctor.license_no}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2 */}
        {selectedDoctor && (
          <div style={{ padding: '1.5rem', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: '1.5rem', background: 'white' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: 16, fontWeight: 600 }}>Step 2: Select Date & Time</h2>
            {availabilityLoading ? <LoadingSpinner /> : (availability || []).length === 0 ? (
              <p style={{ color: 'gray' }}>This doctor has no availability set yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <CalendarPicker
                  availability={availability}
                  existingAppointments={existingAppointments}
                  selectedDate={selectedDate}
                  onSelect={date => { setSelectedDate(date); setSelectedSlot(null) }}
                />

                {selectedDate && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: 14 }}>
                      Select Time Slot for {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </label>
                    <select
                      value={selectedSlot ? JSON.stringify(selectedSlot) : ''}
                      onChange={e => setSelectedSlot(e.target.value ? JSON.parse(e.target.value) : null)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, fontFamily: 'inherit', background: 'white' }}
                    >
                      <option value="">Choose a time slot...</option>
                      {slotsForDay.map(slot => {
                        const booked = isSlotBooked(slot, selectedDate)
                        return (
                          <option key={slot.id} value={JSON.stringify(slot)} disabled={booked}>
                            {formatTime(slot.start_time)} — {formatTime(slot.end_time)}{booked ? ' (unavailable)' : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {bookingError && (
          <div style={{ padding: '1rem', borderRadius: 8, background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', marginBottom: '1rem' }}>
            {bookingError}
          </div>
        )}

        {selectedDoctor && selectedDate && selectedSlot && !bookedAppointment && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleBookAppointment}
              disabled={isBooking}
              style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: 'none', background: '#0369a1', color: 'white', cursor: isBooking ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isBooking ? 0.6 : 1 }}
            >
              {isBooking ? 'Booking...' : 'Confirm Appointment'}
            </button>
            <button
              onClick={() => { setSelectedDoctor(null); setSelectedDate(''); setSelectedSlot(null); setBookingError(null) }}
              style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600 }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
