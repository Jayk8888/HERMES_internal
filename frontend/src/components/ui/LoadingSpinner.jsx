import { useEffect, useState } from 'react'

export default function LoadingSpinner({
  message = 'Loading...',
  fullPage = false,
  delayMs = 180,
}) {
  const [visible, setVisible] = useState(delayMs === 0)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisible(true)
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [delayMs])

  const wrapperClassName = fullPage
    ? 'flex min-h-screen items-center justify-center bg-canvas px-6'
    : 'flex min-h-[240px] items-center justify-center'

  if (!visible) {
    return <div className={wrapperClassName} aria-hidden="true" />
  }

  return (
    <div className={wrapperClassName} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/90 px-8 py-7 shadow-sm backdrop-blur-sm">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-500">{message}</p>
      </div>
    </div>
  )
}
