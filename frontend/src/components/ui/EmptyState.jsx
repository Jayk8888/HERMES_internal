import Card from './Card'

export default function EmptyState({ title, description, action, icon = '•' }) {
  return (
    <Card tone="subtle" className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-100 bg-white/80 text-lg font-semibold text-primary-600" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  )
}
