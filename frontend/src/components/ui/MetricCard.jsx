import Card from './Card'

export default function MetricCard({ label, value, meta, tone = 'default', icon }) {
  return (
    <Card tone={tone === 'default' ? 'subtle' : tone === 'brand' ? 'accent' : tone}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
            {value}
          </p>
          {meta ? <p className="mt-2 text-sm leading-relaxed text-slate-500">{meta}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-primary-700">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
