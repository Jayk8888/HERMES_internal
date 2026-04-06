import { useEffect, useRef, useState } from 'react'

export function useFetch(fn, deps = [], options = {}) {
  const { enabled = true, key } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  async function fetch() {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)
    setError(null)

    try {
      const result = await fn()

      if (requestIdRef.current === requestId) {
        setData(result)
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setError(error.message)
      }
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

    setData(null)
    void fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, ...deps])

  return { data, loading, error, refetch: fetch }
}
