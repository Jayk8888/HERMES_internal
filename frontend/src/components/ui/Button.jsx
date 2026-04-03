import { createElement } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

const VARIANTS = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-critical text-white shadow-sm hover:bg-critical-dark',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  pill: 'rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100',
}

const SIZES = {
  xs: 'rounded-md px-2.5 py-1 text-xs',
  small: 'px-3 py-1.5 text-xs',
  medium: 'px-4 py-2 text-sm',
  large: 'px-5 py-2.5 text-sm',
  xl: 'rounded-xl px-6 py-3 text-base',
}

export default function Button({
  as: component = 'button',
  children,
  className,
  variant = 'primary',
  size = 'medium',
  block = false,
  loading = false,
  type = 'button',
  ...props
}) {
  return createElement(
    component,
    {
      type: component === 'button' ? type : undefined,
      className: cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.medium,
        block && 'w-full',
        className
      ),
      disabled: loading || props.disabled,
      ...props,
    },
    <>
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </>
  )
}
