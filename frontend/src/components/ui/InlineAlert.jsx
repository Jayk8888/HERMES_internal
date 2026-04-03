import { CircleAlert, CircleCheckBig, Info, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn'

const TONES = {
  critical: {
    wrapper: 'border-critical/20 bg-critical-light text-critical-dark',
    icon: CircleAlert,
  },
  success: {
    wrapper: 'border-success/20 bg-success-light text-success-dark',
    icon: CircleCheckBig,
  },
  warning: {
    wrapper: 'border-warning/20 bg-warning-light text-warning-dark',
    icon: TriangleAlert,
  },
  info: {
    wrapper: 'border-info/20 bg-info-light text-info-dark',
    icon: Info,
  },
}

export default function InlineAlert({ title, message, tone = 'info', actions, role = 'status' }) {
  const config = TONES[tone] ?? TONES.info
  const Icon = config.icon

  return (
    <div className={cn('rounded-2xl border p-4', config.wrapper)} role={role}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  )
}
