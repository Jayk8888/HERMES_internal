import { cn } from '../../lib/cn'

export default function Field({
  label,
  hint,
  error,
  action,
  children,
  htmlFor,
  required = false,
  className,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || action) && (
        <div className="flex items-center justify-between gap-3">
          {label ? (
            <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
              {label}
              {required ? <span className="ml-1 text-critical">*</span> : null}
            </label>
          ) : <span />}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-xs text-critical" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
