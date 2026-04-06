import { cn } from '../../lib/cn'
import Button from './Button'

export default function IconButton({ children, className, ...props }) {
  return (
    <Button
      variant="ghost"
      size="small"
      className={cn('h-10 w-10 rounded-xl p-0', className)}
      {...props}
    >
      {children}
    </Button>
  )
}
