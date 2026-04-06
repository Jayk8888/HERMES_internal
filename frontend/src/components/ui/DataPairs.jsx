export default function DataPairs({ items, columns = 2 }) {
  return (
    <dl className={columns === 1 ? 'grid gap-4' : 'grid gap-x-6 gap-y-4 sm:grid-cols-2'}>
      {items.map(item => (
        <div key={item.label} className="border-t border-slate-200/80 pt-4">
          <dt className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-slate-400">
            {item.label}
          </dt>
          <dd className={`mt-2 text-sm font-semibold leading-relaxed ${item.tone ?? 'text-slate-900'}`}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
