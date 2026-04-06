import { createElement } from 'react'
import { cn } from '../../lib/cn'

const TONES = {
  default: 'border border-slate-200/80 bg-white/82 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.35)] backdrop-blur-sm',
  brand: 'border border-primary-900/80 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white shadow-[0_28px_54px_-34px_rgba(15,35,35,0.6)]',
  accent: 'border border-primary-100 bg-primary-50/55 shadow-[0_12px_32px_-30px_rgba(32,111,109,0.4)]',
  success: 'border border-success/15 bg-success-light/80 shadow-[0_12px_32px_-30px_rgba(22,163,74,0.25)]',
  warning: 'border border-warning/15 bg-warning-light/90 shadow-none',
  subtle: 'border border-slate-200/80 bg-white/55 shadow-none backdrop-blur-sm',
}

export default function Card({
  as: component = 'section',
  tone = 'default',
  interactive = false,
  compact = false,
  className,
  children,
  ...props
}) {
  return createElement(
    component,
    {
      className: cn(
        'rounded-2xl',
        compact ? 'p-4' : 'p-5 sm:p-6',
        TONES[tone] ?? TONES.default,
        interactive && 'transition duration-200 hover:border-primary-200 hover:bg-white/92 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)]',
        className
      ),
      ...props,
    },
    children
  )
}
