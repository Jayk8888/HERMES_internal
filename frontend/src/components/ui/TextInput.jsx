import { cn } from '../../lib/cn'

export const inputClassName =
  'form-input block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 read-only:bg-slate-50'

export default function TextInput({ className, ...props }) {
  return <input className={cn(inputClassName, className)} {...props} />
}
