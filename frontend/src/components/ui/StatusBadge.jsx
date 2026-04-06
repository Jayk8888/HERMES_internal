import { cn } from '../../lib/cn'

const STYLES = {
  scheduled: 'bg-info-light text-info-dark',
  completed: 'bg-success-light text-success-dark',
  cancelled: 'bg-slate-100 text-slate-500 line-through',
  available: 'bg-success-light text-success-dark',
  booked: 'bg-primary-50 text-primary-700',
  selected: 'bg-primary-600 text-white',
  info: 'bg-info-light text-info-dark',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  critical: 'bg-critical-light text-critical-dark',
  neutral: 'bg-slate-100 text-slate-600',
}

function getLabel(value) {
  if (!value) return 'Unknown'
  return value.replaceAll('_', ' ')
}

export default function StatusBadge({ status, tone, children }) {
  const variant = tone || status || 'neutral'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        STYLES[variant] ?? STYLES.neutral
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'completed' || variant === 'available' || variant === 'success'
            ? 'bg-success'
            : variant === 'scheduled' || variant === 'booked' || variant === 'info' || variant === 'selected'
              ? 'bg-info'
              : variant === 'warning'
                ? 'bg-warning'
                : variant === 'cancelled'
                  ? 'bg-slate-400'
                  : 'bg-critical'
        )}
        aria-hidden="true"
      />
      {children || getLabel(status || variant)}
    </span>
  )
}
