import { cn } from '../../lib/cn'

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
}

function getInitials(name) {
  if (!name) return 'HM'

  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

export default function Avatar({ name, size = 'md', className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-600 font-semibold text-white ring-2 ring-white/80',
        SIZES[size] ?? SIZES.md,
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  )
}
