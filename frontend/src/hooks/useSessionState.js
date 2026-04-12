import { useEffect, useState } from 'react'

function readSessionValue(key, initialValue) {
  if (typeof window === 'undefined') {
    return initialValue
  }

  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : initialValue
  } catch {
    return initialValue
  }
}

export function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => readSessionValue(key, initialValue))

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore storage write failures
    }
  }, [key, value])

  function clearValue(nextValue = initialValue) {
    setValue(nextValue)

    if (typeof window === 'undefined') return

    try {
      window.sessionStorage.removeItem(key)
    } catch {
      // ignore storage delete failures
    }
  }

  return [value, setValue, clearValue]
}
