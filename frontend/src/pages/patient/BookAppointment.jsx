import { useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, CalendarPlus2, CheckCircle2, Clock3, Stethoscope } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import InlineAlert from '../../components/ui/InlineAlert'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import SectionHeader from '../../components/ui/SectionHeader'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/cn'
import { getProfileName } from '../../lib/data'
import { DAYS_JS, MONTH_NAMES } from '../../lib/constants'
import { formatTime } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function CalendarPicker({ availability, existingAppointments, selectedDate, onSelect }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const availableDays = new Set((availability || []).map(slot => slot.day))
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const bookedDates = new Set(
    (existingAppointments || []).map(appointment => {
      const date = new Date(appointment.scheduled_at)
      return toDateStr(date.getFullYear(), date.getMonth(), date.getDate())
    })
  )

  function previousMonth() {
    if (viewMonth === 0) {
      setViewYear(year => year - 1)
      setViewMonth(11)
      return
    }

    setViewMonth(month => month - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(year => year + 1)
      setViewMonth(0)
      return
    }

    setViewMonth(month => month + 1)
  }

  const cells = []
  for (let index = 0; index < firstDay; index += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={previousMonth}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="font-semibold text-slate-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />

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
            <button
              key={day}
              type="button"
              onClick={() => isSelectable && onSelect(dateStr)}
              disabled={!isSelectable}
              className={cn(
                'rounded-2xl border px-2 py-3 text-sm font-medium transition-colors',
                isSelected && 'border-primary-600 bg-primary-600 text-white',
                !isSelected && isSelectable && 'border-primary-100 bg-primary-50 text-primary-800 hover:border-primary-300',
                !isSelected && !isSelectable && 'border-slate-100 bg-slate-50 text-slate-300',
                isToday && !isSelected && 'ring-2 ring-primary-200'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-primary-50" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-primary-600" />
          Selected
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-slate-100" />
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
  const [bookingError, setBookingError] = useState('')

  const { data: doctors, loading, error, refetch } = useFetch(async () => {
    const { data, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, specialization, license_no, profiles (full_name, email)')

    if (doctorsError) throw doctorsError

    return (data || []).sort((first, second) =>
      getProfileName(first.profiles).localeCompare(getProfileName(second.profiles))
    )
  }, [], { key: 'book-appointment-doctors' })

  const { data: availability, loading: availabilityLoading } = useFetch(async () => {
    if (!selectedDoctor) return []

    const { data, error: availabilityError } = await supabase
      .from('availability')
      .select('*')
      .eq('doctor_id', selectedDoctor)

    if (availabilityError) throw availabilityError
    return data || []
  }, [selectedDoctor], {
    key: `book-appointment-availability:${selectedDoctor ?? 'none'}`,
    enabled: Boolean(selectedDoctor),
  })

  const { data: existingAppointments } = useFetch(async () => {
    if (!selectedDoctor) return []

    const { data, error: appointmentsError } = await supabase
      .from('appointments')
      .select('scheduled_at')
      .eq('doctor_id', selectedDoctor)
      .eq('status', 'scheduled')

    if (appointmentsError) throw appointmentsError
    return data || []
  }, [selectedDoctor], {
    key: `book-appointment-existing:${selectedDoctor ?? 'none'}`,
    enabled: Boolean(selectedDoctor),
  })

  const selectedDoctorRecord = doctors?.find(doctor => doctor.id === selectedDoctor) ?? null
  const selectedDayName = selectedDate ? DAYS_JS[new Date(selectedDate).getDay()] : null
  const slotsForDay = availability ? availability.filter(slot => slot.day === selectedDayName) : []

  function isSlotBooked(slot, dateStr) {
    if (!existingAppointments || !dateStr) return false

    return existingAppointments.some(appointment => {
      const date = new Date(appointment.scheduled_at)
      const appointmentDate = toDateStr(date.getFullYear(), date.getMonth(), date.getDate())
      const appointmentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      return appointmentDate === dateStr && appointmentTime >= slot.start_time && appointmentTime < slot.end_time
    })
  }

  async function handleBookAppointment() {
    if (!user?.id || !selectedDoctor || !selectedDate || !selectedSlot) {
      setBookingError('Please select a doctor, date, and time slot.')
      return
    }

    setIsBooking(true)
    setBookingError('')

    try {
      const [startHour, startMinute] = selectedSlot.start_time.split(':')
      const appointmentDate = new Date(selectedDate)
      appointmentDate.setHours(Number(startHour), Number(startMinute), 0, 0)

      const { data, error: bookingRpcError } = await supabase
        .rpc('book_appointment', {
          p_doctor_id: selectedDoctor,
          p_scheduled_at: appointmentDate.toISOString(),
        })

      if (bookingRpcError) throw bookingRpcError

      setBookedAppointment(data ?? null)
      setSelectedDoctor(null)
      setSelectedDate('')
      setSelectedSlot(null)
    } catch (requestError) {
      const message = requestError.message || 'Failed to book appointment'
      setBookingError(
        message.includes('row-level security policy')
          ? 'Your account is not allowed to book appointments yet. Complete your patient profile and sign in again.'
          : message
      )
    } finally {
      setIsBooking(false)
    }
  }

  if (authLoading) {
    return (
      <PageLayout>
        <LoadingSpinner message="Loading booking workspace..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <SectionHeader
          title="Book an appointment"
          description="Choose a doctor, review availability, and confirm a time slot in a guided clinical booking flow."
        />

        {bookedAppointment ? (
          <InlineAlert
            tone="success"
            title="Appointment booked successfully"
            message="Your appointment has been scheduled and is now visible in your appointment list."
            actions={(
              <Button onClick={() => navigate('/patient/appointments')}>
                View your appointments
              </Button>
            )}
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
          <div className="space-y-6">
            <Card className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Step 1
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Select a doctor</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Choose a doctor to see appointment availability and eligible booking dates.
                </p>
              </div>

              {loading ? <LoadingSpinner message="Loading doctors..." /> : null}
              {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

              {!loading && !error && doctors?.length === 0 ? (
                <EmptyState
                  icon={<Stethoscope className="h-5 w-5" />}
                  title="No doctors available"
                  description="Doctors appear here once their profiles have been completed."
                />
              ) : null}

              {!loading && !error && doctors?.length > 0 ? (
                <div className="grid gap-3">
                  {doctors.map(doctor => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => {
                        setSelectedDoctor(doctor.id)
                        setSelectedDate('')
                        setSelectedSlot(null)
      const appointmentDate = new Date(`${selectedDate}T00:00:00`)
      appointmentDate.setHours(Number(startHour), Number(startMinute), 0, 0)
                      className={cn(
                        'rounded-3xl border px-5 py-4 text-left transition-colors',
                        selectedDoctor === doctor.id
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            Dr. {getProfileName(doctor.profiles)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{doctor.specialization}</p>
                        </div>
                        <div className="space-y-1 text-sm text-slate-500 sm:text-right">
                          <p>{doctor.profiles?.email || 'No email available'}</p>
                          <p>License: {doctor.license_no}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </Card>

            <Card className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Step 2
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Select date and time</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Availability is derived from the selected doctor’s weekly schedule.
                </p>
              </div>

              {!selectedDoctor ? (
                <EmptyState
                  icon={<CalendarDays className="h-5 w-5" />}
                  title="Choose a doctor first"
                  description="Select a doctor in step 1 to unlock the calendar and available slots."
                />
              ) : availabilityLoading ? (
                <LoadingSpinner message="Loading availability..." />
              ) : (availability || []).length === 0 ? (
                <EmptyState
                  icon={<Clock3 className="h-5 w-5" />}
                  title="No availability set yet"
                  description="This doctor has not added weekly availability yet. Try a different doctor or check back later."
                />
              ) : (
                <div className="space-y-5">
                  <CalendarPicker
                    availability={availability}
                    existingAppointments={existingAppointments}
                    selectedDate={selectedDate}
                    onSelect={date => {
                      setSelectedDate(date)
                      setSelectedSlot(null)
                    }}
                  />

                  {selectedDate ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Available slots for{' '}
                          {new Date(selectedDate).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                        <p className="text-sm text-slate-500">
                          Unavailable slots are already booked for this doctor.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {slotsForDay.map(slot => {
                          const booked = isSlotBooked(slot, selectedDate)

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={booked}
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                'rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
                                booked && 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300',
                                !booked && selectedSlot?.id === slot.id && 'border-primary-500 bg-primary-600 text-white',
                                !booked && selectedSlot?.id !== slot.id && 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50'
                              )}
                            >
                              <p className="font-semibold">
                                {formatTime(slot.start_time)} to {formatTime(slot.end_time)}
                              </p>
                              <p className={cn('mt-1 text-xs', booked ? 'text-slate-300' : selectedSlot?.id === slot.id ? 'text-primary-50' : 'text-slate-400')}>
                                {booked ? 'Unavailable' : 'Available'}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          </div>

          <Card tone="brand" className="h-fit xl:sticky xl:top-24">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-50/70">
                  Booking summary
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-white">
                  Confirm your appointment
                </h3>
              </div>

              <div className="space-y-3 rounded-[28px] border border-white/10 bg-white/10 p-5 text-sm text-primary-50/80">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-50/60">
                    Doctor
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {selectedDoctorRecord ? `Dr. ${getProfileName(selectedDoctorRecord.profiles)}` : 'Choose a doctor'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-50/60">
                    Specialization
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {selectedDoctorRecord?.specialization || 'Select a doctor first'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-50/60">
                    Date
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Choose a date'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-50/60">
                    Time slot
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {selectedSlot ? `${formatTime(selectedSlot.start_time)} to ${formatTime(selectedSlot.end_time)}` : 'Choose a slot'}
                  </p>
                </div>
              </div>

              {bookingError ? <ErrorMessage message={bookingError} /> : null}

              <div className="space-y-3">
                <Button
                  block
                  loading={isBooking}
                  onClick={handleBookAppointment}
                  disabled={!selectedDoctor || !selectedDate || !selectedSlot || isBooking}
                  className="bg-white text-primary-800 hover:bg-primary-50"
                >
                  {isBooking ? 'Booking...' : 'Confirm appointment'}
                </Button>
                <Button
                  block
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                  onClick={() => {
                    setSelectedDoctor(null)
                    setSelectedDate('')
                    setSelectedSlot(null)
                    setBookingError('')
                  }}
                >
                  Reset selection
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
