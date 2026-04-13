import { useEffect, useRef, useState } from 'react'

const fetchCache = new Map()
const MAX_CACHE_ENTRIES = 200

function purgeStaleEntries(maxAge) {
  if (!maxAge) return

  const now = Date.now()

  for (const [key, entry] of fetchCache.entries()) {
    if (now - entry.timestamp > maxAge) {
      fetchCache.delete(key)
    }
  }
}

function getCachedEntry(key) {
  if (!key) return null
  return fetchCache.get(key) ?? null
}

function setCachedEntry(key, value, maxAge) {
  if (!key) return
  purgeStaleEntries(maxAge)

  if (fetchCache.has(key)) {
    fetchCache.delete(key)
  }

  while (fetchCache.size >= MAX_CACHE_ENTRIES) {
    fetchCache.delete(fetchCache.keys().next().value)
  }

  fetchCache.set(key, value)
}

function isFresh(entry, ttl) {
  if (!entry) return false
  return Date.now() - entry.timestamp <= ttl
}

export function invalidateFetchCache(match) {
  if (!match) {
    fetchCache.clear()
    return
  }

  for (const key of fetchCache.keys()) {
    if (typeof match === 'string' ? key.startsWith(match) : match(key)) {
      fetchCache.delete(key)
    }
  }
}

export function useFetch(fn, deps = [], options = {}) {
  const {
    enabled = true,
    key,
    ttl = 30_000,
    staleWhileRevalidate = true,
  } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  async function fetch(fetchOptions = {}) {
    const { force = false } = fetchOptions
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    const cachedEntry = getCachedEntry(key)
    const usingStaleEntry = !force && cachedEntry && staleWhileRevalidate

    if (usingStaleEntry) {
      setData(cachedEntry.data ?? null)
      setError(cachedEntry.error ?? null)
      setLoading(!isFresh(cachedEntry, ttl))
    } else {
      setLoading(true)
      setError(null)
    }

    if (!force && cachedEntry && isFresh(cachedEntry, ttl)) {
      return cachedEntry.data ?? null
    }

    setLoading(true)
    if (!usingStaleEntry) {
      setError(null)
    }

    try {
      const result = await fn()

      if (requestIdRef.current === requestId) {
        setData(result)
      }

      setCachedEntry(key, {
        data: result,
        error: null,
        timestamp: Date.now(),
      }, ttl)

      return result
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setError(error.message)
      }

      setCachedEntry(key, {
        data: cachedEntry?.data ?? null,
        error: error.message,
        timestamp: cachedEntry?.timestamp ?? 0,
      }, ttl)
      return cachedEntry?.data ?? null
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const cachedEntry = getCachedEntry(key)

    if (cachedEntry && staleWhileRevalidate) {
      setData(cachedEntry.data ?? null)
      setError(cachedEntry.error ?? null)
      setLoading(!isFresh(cachedEntry, ttl))
    } else {
      setData(null)
    }

    void fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, ttl, staleWhileRevalidate, ...deps])

  return {
    data,
    loading,
    error,
    refetch: options => fetch({ force: true, ...(options ?? {}) }),
  }
}
