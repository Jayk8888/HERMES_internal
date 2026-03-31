import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function PatientBookAppointment() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [bookedAppointment, setBookedAppointment] = useState(null)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState(null)

  const { data: doctors, loading, error, refetch } = useFetch(async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        id,
        specialization,
        license_no,
        profiles (full_name, email)
      `)
      .order('profiles.full_name')

    if (error) throw error
    return data || []
  })

  const { data: availability, loading: availabilityLoading } = useFetch(async () => {
    if (!selectedDoctor) return []

    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('doctor_id', selectedDoctor)
      .order('day')

    if (error) throw error
    return data || []
  }, [selectedDoctor])

  async function handleBookAppointment() {
    if (!user?.id || !selectedDoctor || !selectedDate || !selectedTime) {
      setBookingError('Please fill in all fields')
      return
    }

    setIsBooking(true)
    setBookingError(null)

    try {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`)

      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            patient_id: user.id,
            doctor_id: selectedDoctor,
            scheduled_at: dateTime.toISOString(),
            status: 'scheduled'
          }
        ])
        .select()

      if (error) throw error

      setBookedAppointment(data?.[0])
      setSelectedDoctor(null)
      setSelectedDate('')
      setSelectedTime('')
    } catch (error) {
      setBookingError(error.message || 'Failed to book appointment')
    } finally {
      setIsBooking(false)
    }
  }

  if (authLoading) {
    return (
      <PageLayout>
        <h1>Book Appointment</h1>
        <LoadingSpinner />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Book an Appointment</h1>
          <p style={{ color: 'gray' }}>Select a doctor and available time slot</p>
        </div>

        {bookedAppointment && (
          <div style={{
            padding: '1.25rem',
            borderRadius: 12,
            background: '#dcfce7',
            border: '1px solid #86efac',
            marginBottom: '2rem'
          }}>
            <p style={{ color: '#15803d', fontWeight: 500, marginBottom: '0.5rem' }}>✓ Appointment booked successfully!</p>
            <p style={{ color: '#15803d', fontSize: 14, marginBottom: '1rem' }}>
              Your appointment has been scheduled.
            </p>
            <button
              onClick={() => navigate('/patient/appointments')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                border: 'none',
                background: '#15803d',
                color: 'white',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              View Your Appointments
            </button>
          </div>
        )}

        {/* Step 1: Select Doctor */}
        <div style={{
          padding: '1.5rem',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          marginBottom: '1.5rem',
          background: 'white'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: 16, fontWeight: 600 }}>Step 1: Select a Doctor</h2>

          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} onRetry={refetch} />}

          {!loading && !error && doctors && (
            <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {doctors.map(doctor => (
                <div
                  key={doctor.id}
                  onClick={() => {
                    setSelectedDoctor(doctor.id)
                    setSelectedDate('')
                    setSelectedTime('')
                  }}
                  style={{
                    padding: '1rem',
                    borderRadius: 8,
                    border: selectedDoctor === doctor.id ? '2px solid #0369a1' : '1px solid #e5e7eb',
                    background: selectedDoctor === doctor.id ? '#f0f9ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    Dr. {doctor.profiles?.full_name || 'Unknown'}
                  </p>
                  <p style={{ fontSize: 14, color: 'gray', marginBottom: '0.25rem' }}>
                    {doctor.specialization}
                  </p>
                  <p style={{ fontSize: 12, color: '#666' }}>License: {doctor.license_no}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Select Date and Time */}
        {selectedDoctor && (
          <div style={{
            padding: '1.5rem',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            marginBottom: '1.5rem',
            background: 'white'
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: 16, fontWeight: 600 }}>Step 2: Select Date & Time</h2>

            {availabilityLoading ? (
              <LoadingSpinner />
            ) : availability && availability.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      fontSize: 14,
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Select Time
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      fontSize: 14,
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            ) : (
              <p style={{ color: 'gray' }}>This doctor has no availability currently</p>
            )}
          </div>
        )}

        {/* Error Message */}
        {bookingError && (
          <div style={{
            padding: '1rem',
            borderRadius: 8,
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            marginBottom: '1rem'
          }}>
            {bookingError}
          </div>
        )}

        {/* Book Button */}
        {selectedDoctor && selectedDate && selectedTime && !bookedAppointment && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleBookAppointment}
              disabled={isBooking}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 8,
                border: 'none',
                background: '#0369a1',
                color: 'white',
                cursor: isBooking ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: isBooking ? 0.6 : 1
              }}
            >
              {isBooking ? 'Booking...' : 'Confirm Appointment'}
            </button>
            <button
              onClick={() => {
                setSelectedDoctor(null)
                setSelectedDate('')
                setSelectedTime('')
                setBookingError(null)
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
