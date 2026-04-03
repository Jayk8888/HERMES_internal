export default function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <span className="mb-3 inline-flex text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
            {eyebrow}
          </span>
        ) : null}
        {title ? (
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="mt-3 text-base leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}
