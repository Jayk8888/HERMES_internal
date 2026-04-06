import { useState } from 'react'
import { CalendarDays, Clock3 } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Field from '../../components/ui/Field'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import SectionHeader from '../../components/ui/SectionHeader'
import Select from '../../components/ui/Select'
import TimePicker from '../../components/ui/TimePicker'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../hooks/useAuth.jsx'
import { WEEK_DAYS } from '../../lib/constants'
import { formatTime } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'

export default function DoctorAvailability() {
  const { user } = useAuth()
  const [day, setDay] = useState('Monday')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const { data, loading, error, refetch } = useFetch(() =>
    user
      ? supabase
          .from('availability')
          .select('id, day, start_time, end_time')
          .eq('doctor_id', user.id)
          .order('start_time', { ascending: true })
          .then(response => {
            if (response.error) throw response.error
            return response.data
          })
      : Promise.resolve([])
  , [user?.id], { key: `doctor-availability:${user?.id ?? 'anonymous'}` })

  async function handleAdd(event) {
    event.preventDefault()
    setAddError('')

    const overlaps = (data ?? []).some(slot => {
      if (slot.day !== day) return false
      return startTime < slot.end_time && endTime > slot.start_time
    })

    if (overlaps) {
      setAddError('This slot overlaps with an existing one.')
      return
    }

    if (endTime <= startTime) {
      setAddError('End time must be after start time.')
      return
    }

    setAdding(true)

    try {
      const { error: insertError } = await supabase
        .from('availability')
        .insert({ doctor_id: user.id, day, start_time: startTime, end_time: endTime })

      if (insertError) throw insertError
      setStartTime('')
      setEndTime('')
      await refetch()
    } catch (requestError) {
      setAddError(requestError.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)

    try {
      const { error: deleteError } = await supabase
        .from('availability')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await refetch()
    } catch (requestError) {
      setAddError(requestError.message)
    } finally {
      setDeletingId(null)
    }
  }

  const grouped = WEEK_DAYS.reduce((result, currentDay) => {
    result[currentDay] = (data ?? []).filter(slot => slot.day === currentDay)
    return result
  }, {})

  return (
    <PageLayout width="wide">
      <div className="space-y-6">
        <SectionHeader
          title="Availability"
          description="Set weekly bookable windows so patients can only choose times that match your clinical schedule."
        />

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card tone="subtle" className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Add availability
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Create a weekly slot</h3>
            </div>

            {addError ? <ErrorMessage message={addError} /> : null}

            <form className="space-y-4" onSubmit={handleAdd}>
              <Field label="Day" htmlFor="availability-day">
                <Select id="availability-day" value={day} onChange={event => setDay(event.target.value)}>
                  {WEEK_DAYS.map(currentDay => (
                    <option key={currentDay} value={currentDay}>{currentDay}</option>
                  ))}
                </Select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
                <TimePicker label="End time" value={endTime} onChange={setEndTime} />
              </div>

              <Button type="submit" loading={adding} block>
                {adding ? 'Adding...' : 'Add slot'}
              </Button>
            </form>
          </Card>

          <div className="space-y-4">
            {loading ? <LoadingSpinner message="Loading availability..." /> : null}
            {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

            {!loading && !error && WEEK_DAYS.every(currentDay => !grouped[currentDay]?.length) ? (
              <EmptyState
                icon={<Clock3 className="h-5 w-5" />}
                title="No availability set yet"
                description="Add your first weekly slot and patients will be able to book around it."
              />
            ) : null}

            {!loading && !error && WEEK_DAYS.some(currentDay => grouped[currentDay]?.length) ? (
              <Card className="space-y-6">
                {WEEK_DAYS.map(currentDay => {
                  const slots = grouped[currentDay]
                  if (!slots?.length) return null

                  return (
                    <section
                      key={currentDay}
                      className="space-y-4 border-t border-slate-200/80 pt-6 first:border-t-0 first:pt-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary-100 bg-white/80 text-primary-700">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{currentDay}</p>
                          <p className="text-xs text-slate-400">{slots.length} slot{slots.length === 1 ? '' : 's'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {slots.map(slot => (
                          <div
                            key={slot.id}
                            className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-slate-50/80 px-4 py-2 text-sm text-slate-700"
                          >
                            <span className="font-semibold">
                              {formatTime(slot.start_time)} to {formatTime(slot.end_time)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(slot.id)}
                              disabled={deletingId === slot.id}
                              className="rounded-full px-3 py-1 text-xs font-semibold text-critical transition-colors hover:bg-critical-light disabled:opacity-60"
                            >
                              {deletingId === slot.id ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
