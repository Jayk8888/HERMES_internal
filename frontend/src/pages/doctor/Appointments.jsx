import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import SectionHeader from '../../components/ui/SectionHeader'
import Select from '../../components/ui/Select'
import StatusBadge from '../../components/ui/StatusBadge'
import PageLayout from '../../components/layout/PageLayout'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/cn'
import { MONTH_NAMES } from '../../lib/constants'
import { formatDate, formatDateTime } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MINUTES_PER_HOUR = 60
const APPOINTMENT_DURATION_MINUTES = 60
const HOUR_HEIGHT = 72
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 20
const MIN_VISIBLE_HOUR = 6
const MAX_VISIBLE_HOUR = 22

function getProfile(value) {
  if (!value) return {}
  return Array.isArray(value) ? value[0] : value
}

function padNumber(value) {
  return String(value).padStart(2, '0')
}

function toDateKey(value) {
  if (!value) return ''
  if (typeof value === 'string' && value.length === 10) return value

  const date = new Date(value)
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function dateFromKey(dateKey) {
  if (!dateKey) return null

  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function buildAppointmentsByDate(appointments) {
  const groupedAppointments = new Map()

  for (const appointment of appointments || []) {
    const dateKey = toDateKey(appointment.scheduled_at)
    const appointmentsForDay = groupedAppointments.get(dateKey) || []
    appointmentsForDay.push(appointment)
    groupedAppointments.set(dateKey, appointmentsForDay)
  }

  return groupedAppointments
}

function buildYearOptions(appointments, todayYear) {
  const years = appointments
    .map(appointment => new Date(appointment.scheduled_at).getFullYear())
    .filter(year => Number.isFinite(year))

  const minYear = Math.min(todayYear - 1, ...(years.length > 0 ? years : [todayYear]))
  const maxYear = Math.max(todayYear + 1, ...(years.length > 0 ? years : [todayYear]))
  const options = []

  for (let year = minYear; year <= maxYear; year += 1) options.push(year)

  return options
}

function syncSelectedDateToMonth(currentSelectedDateKey, nextYear, nextMonth) {
  const currentDate = dateFromKey(currentSelectedDateKey) || new Date(nextYear, nextMonth, 1)
  const nextMonthLastDay = new Date(nextYear, nextMonth + 1, 0).getDate()
  const nextDay = Math.min(currentDate.getDate(), nextMonthLastDay)

  return `${nextYear}-${padNumber(nextMonth + 1)}-${padNumber(nextDay)}`
}

function shiftMonth(year, month, delta) {
  const nextDate = new Date(year, month + delta, 1)
  return {
    year: nextDate.getFullYear(),
    month: nextDate.getMonth(),
  }
}

function buildDayPickerCells(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const firstGridDate = new Date(firstOfMonth)
  firstGridDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay())

  const cells = []

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(firstGridDate)
    cellDate.setDate(firstGridDate.getDate() + index)

    cells.push({
      dateKey: toDateKey(cellDate),
      day: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === month,
    })
  }

  return cells
}

function getDaySummary(appointmentsForDay = []) {
  return {
    count: appointmentsForDay.length,
    hasScheduled: appointmentsForDay.some(appointment => appointment.status === 'scheduled'),
    hasCompleted: appointmentsForDay.some(appointment => appointment.status === 'completed'),
    hasCancelled: appointmentsForDay.some(appointment => appointment.status === 'cancelled'),
  }
}

function getStatusTone(status) {
  if (status === 'scheduled') {
    return {
      cardClassName: 'border-info/25 bg-info-light/95 text-info-dark shadow-[0_18px_28px_-26px_rgba(37,99,235,0.32)]',
      timeClassName: 'text-info-dark/80',
      accentClassName: 'bg-info',
      linkClassName: 'text-info-dark hover:text-info-dark',
    }
  }

  if (status === 'completed') {
    return {
      cardClassName: 'border-success/20 bg-success-light/90 text-success-dark shadow-[0_18px_28px_-26px_rgba(22,163,74,0.4)]',
      timeClassName: 'text-success-dark/80',
      accentClassName: 'bg-success',
      linkClassName: 'text-success-dark hover:text-success-dark',
    }
  }

  return {
    cardClassName: 'border-slate-200 border-dashed bg-slate-50/95 text-slate-700 shadow-none',
    timeClassName: 'text-slate-500',
    accentClassName: 'bg-slate-400',
    linkClassName: 'text-slate-600 hover:text-slate-900',
  }
}

function formatAppointmentCount(count) {
  return `${count} appointment${count === 1 ? '' : 's'}`
}

function formatClockTime(value) {
  return formatDateTime(value, { hour: 'numeric', minute: '2-digit' })
}

function formatTimeRange(startValue, endValue) {
  return `${formatClockTime(startValue)} - ${formatClockTime(endValue)}`
}

function getMinutesSinceStartOfDay(value) {
  const date = new Date(value)
  return (date.getHours() * MINUTES_PER_HOUR) + date.getMinutes()
}

function getTimelineWindow(appointmentsForDay = []) {
  if (appointmentsForDay.length === 0) {
    return {
      startHour: DEFAULT_START_HOUR,
      endHour: DEFAULT_END_HOUR,
    }
  }

  const startMinutes = appointmentsForDay.map(appointment => getMinutesSinceStartOfDay(appointment.scheduled_at))
  const endMinutes = startMinutes.map(startMinute => startMinute + APPOINTMENT_DURATION_MINUTES)
  const earliestHour = Math.floor(Math.min(...startMinutes) / MINUTES_PER_HOUR) - 1
  const latestHour = Math.ceil(Math.max(...endMinutes) / MINUTES_PER_HOUR) + 1

  return {
    startHour: Math.max(MIN_VISIBLE_HOUR, Math.min(DEFAULT_START_HOUR, earliestHour)),
    endHour: Math.min(MAX_VISIBLE_HOUR, Math.max(DEFAULT_END_HOUR, latestHour)),
  }
}

function buildPositionedAppointments(appointmentsForDay, timelineStartHour, timelineEndHour) {
  const timelineStartMinute = timelineStartHour * MINUTES_PER_HOUR
  const timelineEndMinute = timelineEndHour * MINUTES_PER_HOUR
  const pixelsPerMinute = HOUR_HEIGHT / MINUTES_PER_HOUR
  const normalizedAppointments = (appointmentsForDay || [])
    .map(appointment => {
      const startMinute = getMinutesSinceStartOfDay(appointment.scheduled_at)
      const endMinute = Math.min(startMinute + APPOINTMENT_DURATION_MINUTES, timelineEndMinute)

      return {
        id: appointment.id,
        startMinute,
        endMinute,
        appointment,
      }
    })
    .sort((first, second) => first.startMinute - second.startMinute)

  const groups = []
  let currentGroup = []
  let currentGroupEnd = -1

  for (const item of normalizedAppointments) {
    if (currentGroup.length === 0 || item.startMinute < currentGroupEnd) {
      currentGroup.push(item)
      currentGroupEnd = Math.max(currentGroupEnd, item.endMinute)
      continue
    }

    groups.push(currentGroup)
    currentGroup = [item]
    currentGroupEnd = item.endMinute
  }

  if (currentGroup.length > 0) groups.push(currentGroup)

  return groups.flatMap(group => {
    const activeColumns = []
    const positionedItems = []
    let maxColumns = 0

    for (const item of group) {
      let columnIndex = 0

      while (activeColumns[columnIndex] > item.startMinute) columnIndex += 1

      activeColumns[columnIndex] = item.endMinute
      maxColumns = Math.max(maxColumns, activeColumns.filter(Boolean).length)

      positionedItems.push({
        ...item,
        columnIndex,
      })
    }

    return positionedItems.map(item => ({
      ...item,
      columnCount: maxColumns,
      top: Math.max(0, item.startMinute - timelineStartMinute) * pixelsPerMinute,
      height: Math.max(52, (item.endMinute - item.startMinute) * pixelsPerMinute),
    }))
  })
}

function MonthDayPicker({
  appointmentsByDate,
  selectedDateKey,
  todayKey,
  viewMonth,
  viewYear,
  yearOptions,
  onPreviousMonth,
  onNextMonth,
  onSelectMonth,
  onSelectYear,
  onSelectDate,
}) {
  const cells = buildDayPickerCells(viewYear, viewMonth)

  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Choose day
          </p>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Month picker</h3>
              <p className="text-sm text-slate-500">
                Browse dates, then review the day schedule below.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <Button
            variant="ghost"
            size="small"
            onClick={onPreviousMonth}
            aria-label="View previous month"
            className="h-9 w-9 rounded-xl p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={onNextMonth}
            aria-label="View next month"
            className="h-9 w-9 rounded-xl p-0"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <Select value={viewMonth} onChange={event => onSelectMonth(Number(event.target.value))}>
          {MONTH_NAMES.map((monthName, monthIndex) => (
            <option key={monthName} value={monthIndex}>
              {monthName}
            </option>
          ))}
        </Select>

        <Select value={viewYear} onChange={event => onSelectYear(Number(event.target.value))}>
          {yearOptions.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {WEEKDAY_LABELS.map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(cell => {
          const summary = getDaySummary(appointmentsByDate.get(cell.dateKey) || [])
          const isSelected = selectedDateKey === cell.dateKey
          const isToday = todayKey === cell.dateKey

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate(cell)}
              aria-pressed={isSelected}
              className={cn(
                'relative flex aspect-square items-start justify-start rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors',
                isSelected && 'border-primary-600 bg-primary-600 text-white shadow-sm',
                !isSelected && summary.count > 0 && cell.inCurrentMonth && 'border-success/30 bg-success-light/75 text-slate-900 hover:border-success/40 hover:bg-success-light/90',
                !isSelected && summary.count > 0 && !cell.inCurrentMonth && 'border-success/20 bg-success-light/40 text-slate-400 hover:bg-success-light/55',
                !isSelected && summary.count === 0 && cell.inCurrentMonth && 'border-transparent bg-white text-slate-800 hover:border-primary-100 hover:bg-primary-50/60',
                !isSelected && summary.count === 0 && !cell.inCurrentMonth && 'border-transparent bg-transparent text-slate-300 hover:bg-slate-50',
                isToday && !isSelected && 'ring-2 ring-primary-200'
              )}
            >
              <span className="leading-none">{cell.day}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function SelectedDaySummary({ selectedDate, selectedDateAppointments, todayKey }) {
  const earliest = selectedDateAppointments[0]?.scheduled_at
  const latest = selectedDateAppointments[selectedDateAppointments.length - 1]?.scheduled_at
  const isTodaySelected = toDateKey(selectedDate) === todayKey

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Selected day
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            {formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          <p className="text-sm text-slate-500">
            {formatAppointmentCount(selectedDateAppointments.length)}
          </p>
        </div>

        {isTodaySelected ? (
          <div className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
            Today
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Day snapshot
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {selectedDateAppointments.length > 0
            ? `Appointments run from ${formatClockTime(earliest)} to ${formatClockTime(latest)}.`
            : 'No visits booked for this day.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusBadge status="scheduled" />
        <StatusBadge status="completed" />
        <StatusBadge status="cancelled" />
      </div>
    </Card>
  )
}

function DayTimeline({ selectedDate, selectedDateAppointments, todayKey, onToday }) {
  const { startHour, endHour } = getTimelineWindow(selectedDateAppointments)
  const hours = []

  for (let hour = startHour; hour < endHour; hour += 1) hours.push(hour)

  const positionedAppointments = buildPositionedAppointments(selectedDateAppointments, startHour, endHour)
  const totalMinutes = (endHour - startHour) * MINUTES_PER_HOUR
  const totalHeight = totalMinutes * (HOUR_HEIGHT / MINUTES_PER_HOUR)
  const isTodaySelected = toDateKey(selectedDate) === todayKey

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Day timeline
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">
            {formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
            {formatAppointmentCount(selectedDateAppointments.length)}
          </div>
          {!isTodaySelected ? (
            <Button variant="ghost" size="small" onClick={onToday}>
              Jump to today
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[42rem]">
          <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3">
            <div className="relative" style={{ height: totalHeight }}>
              {hours.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 text-right text-xs font-medium text-slate-400"
                  style={{ top: index * HOUR_HEIGHT - 9 }}
                >
                  {index === 0 ? null : formatDateTime(new Date(2026, 0, 1, hour), { hour: 'numeric' })}
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90" style={{ height: totalHeight }}>
              {hours.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-slate-200"
                  style={{ top: index * HOUR_HEIGHT }}
                >
                  <div className="absolute inset-x-0 top-[36px] border-t border-dashed border-slate-100" />
                </div>
              ))}

              {positionedAppointments.map(item => {
                const patient = getProfile(item.appointment.patients)
                const patientProfile = getProfile(patient?.profiles)
                const endAt = new Date(new Date(item.appointment.scheduled_at).getTime() + APPOINTMENT_DURATION_MINUTES * 60 * 1000)
                const statusTone = getStatusTone(item.appointment.status)
                const columnWidth = 100 / item.columnCount
                const leftOffset = item.columnIndex * columnWidth

                return (
                  <div
                    key={item.id}
                    className="absolute box-border px-1.5 py-1"
                    style={{
                      top: item.top,
                      height: item.height,
                      width: `calc(${columnWidth}% - 0.25rem)`,
                      left: `calc(${leftOffset}% + 0.125rem)`,
                    }}
                  >
                    <div
                      className={cn(
                        'flex h-full min-h-[52px] flex-col overflow-hidden rounded-2xl border px-3 py-3',
                        statusTone.cardClassName
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={patientProfile?.full_name || 'Unknown patient'} size="sm" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {patientProfile?.full_name || 'Unknown patient'}
                          </p>
                          <p className={cn('mt-1 text-xs font-medium', statusTone.timeClassName)}>
                            {formatTimeRange(item.appointment.scheduled_at, endAt)}
                          </p>
                        </div>
                        <div className="self-center">
                          <StatusBadge status={item.appointment.status} />
                        </div>
                        <Button
                          as={Link}
                          to={`/doctor/appointments/${item.appointment.id}`}
                          variant="secondary"
                          size="xs"
                          className={cn('self-center shrink-0 whitespace-nowrap border-white/70 bg-white/80 px-2 py-1 text-[11px] shadow-none', statusTone.linkClassName)}
                        >
                          View details
                        </Button>
                      </div>

                    </div>
                  </div>
                )
              })}

              {selectedDateAppointments.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="max-w-md rounded-3xl border border-dashed border-slate-200 bg-white/90 px-8 py-10 text-center shadow-[0_20px_40px_-36px_rgba(15,23,42,0.45)]">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
                      0
                    </div>
                    <h4 className="mt-4 text-lg font-semibold text-slate-900">No appointments on this day</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Pick another date or review upcoming visits in another month.
                    </p>
                    {!isTodaySelected ? (
                      <Button variant="secondary" size="small" onClick={onToday} className="mt-5">
                        Back to today
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function DoctorAppointments() {
  const { user } = useAuth()
  const [today] = useState(() => new Date())
  const todayKey = toDateKey(today)
  const [viewYear, setViewYear] = useState(() => today.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => today.getMonth())
  const [selectedDateKey, setSelectedDateKey] = useState(() => todayKey)

  const { data, loading, error, refetch } = useFetch(async () => {
    if (!user?.id) return []

    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        patients (
          id,
          profiles (
            full_name,
            email
          )
        )
      `)
      .eq('doctor_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (fetchError) throw fetchError
    return appointments || []
  }, [user?.id], { key: `doctor-appointments:${user?.id ?? 'anonymous'}` })

  const appointments = useMemo(() => data || [], [data])
  const appointmentsByDate = useMemo(() => buildAppointmentsByDate(appointments), [appointments])
  const selectedDate = dateFromKey(selectedDateKey) || today
  const selectedDateAppointments = appointmentsByDate.get(selectedDateKey) || []
  const yearOptions = useMemo(() => buildYearOptions(appointments, today.getFullYear()), [appointments, today])
  function handleVisibleMonthChange(nextYear, nextMonth) {
    setViewYear(nextYear)
    setViewMonth(nextMonth)
    setSelectedDateKey(currentSelectedDateKey => syncSelectedDateToMonth(currentSelectedDateKey, nextYear, nextMonth))
  }

  function handlePreviousMonth() {
    const next = shiftMonth(viewYear, viewMonth, -1)
    handleVisibleMonthChange(next.year, next.month)
  }

  function handleNextMonth() {
    const next = shiftMonth(viewYear, viewMonth, 1)
    handleVisibleMonthChange(next.year, next.month)
  }

  function handleSelectDate(cell) {
    setSelectedDateKey(cell.dateKey)

    if (!cell.inCurrentMonth) {
      const nextDate = dateFromKey(cell.dateKey)
      setViewYear(nextDate.getFullYear())
      setViewMonth(nextDate.getMonth())
    }
  }

  function handleToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelectedDateKey(todayKey)
  }

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <SectionHeader
          title="Appointments"
          description="Choose a day from the month picker, then review the selected date in a focused time-based schedule."
        />

        {loading ? <LoadingSpinner message="Loading appointments..." /> : null}
        {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

        {loading || error ? null : appointments.length === 0 ? (
          <EmptyState
            icon="A"
            title="No appointments found"
            description="Appointments will appear here once patients start booking into your available slots."
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:items-start">
              <MonthDayPicker
                appointmentsByDate={appointmentsByDate}
                selectedDateKey={selectedDateKey}
                todayKey={todayKey}
                viewMonth={viewMonth}
                viewYear={viewYear}
                yearOptions={yearOptions}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
                onSelectMonth={nextMonth => handleVisibleMonthChange(viewYear, nextMonth)}
                onSelectYear={nextYear => handleVisibleMonthChange(nextYear, viewMonth)}
                onSelectDate={handleSelectDate}
              />

              <SelectedDaySummary
                selectedDate={selectedDate}
                selectedDateAppointments={selectedDateAppointments}
                todayKey={todayKey}
              />
            </div>

            <DayTimeline
              selectedDate={selectedDate}
              selectedDateAppointments={selectedDateAppointments}
              todayKey={todayKey}
              onToday={handleToday}
            />
          </div>
        )}
      </div>
    </PageLayout>
  )
}
