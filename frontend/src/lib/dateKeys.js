export function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function todayDateKey() {
  return toDateKey(new Date())
}

export function dateTimeFromKeyAndTime(dateKey, time) {
  const date = dateFromKey(dateKey)
  const [hours, minutes] = time.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)
  return date
}
