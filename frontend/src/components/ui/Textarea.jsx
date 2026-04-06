import { cn } from '../../lib/cn'
import { inputClassName } from './TextInput'

export default function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(inputClassName, 'form-textarea min-h-[120px] resize-y', className)}
      {...props}
    />
  )
}
