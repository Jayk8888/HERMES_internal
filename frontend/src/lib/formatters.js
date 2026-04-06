import { dateFromKey } from './dateKeys'

export function formatDate(value, options = {}) {
  if (!value) return 'Not available'

  const normalized = typeof value === 'string' && value.length === 10
    ? dateFromKey(value)
    : value

  const hasCustomOptions = Object.keys(options).length > 0

  return new Intl.DateTimeFormat('en-IN', {
    ...(hasCustomOptions ? {} : { dateStyle: 'medium' }),
    ...options,
  }).format(new Date(normalized))
}

export function formatDateTime(value, options = {}) {
  if (!value) return 'Not available'

  const hasCustomOptions = Object.keys(options).length > 0

  return new Intl.DateTimeFormat('en-IN', {
    ...(hasCustomOptions ? {} : { dateStyle: 'medium', timeStyle: 'short' }),
    ...options,
  }).format(new Date(value))
}

export function formatTime(value) {
  if (!value) return ''

  const [hours, minutes] = value.split(':')
  const hour = Number(hours)
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  const suffix = hour >= 12 ? 'PM' : 'AM'

  return `${displayHour}:${minutes} ${suffix}`
}

export function formatShortDate(value) {
  if (!value) return 'Not available'

  const normalized = typeof value === 'string' && value.length === 10
    ? dateFromKey(value)
    : value

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(normalized))
}

export function getAge(value) {
  if (!value) return null

  const birthDate = new Date(value)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDifference = today.getMonth() - birthDate.getMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1
  }

  return age
}
