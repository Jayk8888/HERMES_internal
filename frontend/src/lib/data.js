export function pickFirst(value) {
  return Array.isArray(value) ? value[0] : value
}

export function getProfileName(value, fallback = 'Unknown') {
  if (!value) return fallback

  if (Array.isArray(value)) {
    return value[0]?.full_name ?? fallback
  }

  return value.full_name ?? fallback
}
