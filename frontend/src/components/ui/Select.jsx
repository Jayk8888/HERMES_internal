import { cn } from '../../lib/cn'
import { inputClassName } from './TextInput'

export default function Select({ className, children, ...props }) {
  return (
    <select className={cn(inputClassName, 'form-select pr-10', className)} {...props}>
      {children}
    </select>
  )
}
