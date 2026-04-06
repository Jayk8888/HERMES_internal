export default function AuthShell({
  eyebrow = 'HERMES',
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-canvas px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-shell lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 px-10 py-12 text-white lg:flex lg:flex-col">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 font-display text-xl font-bold">
              H
            </div>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight">HERMES</p>
              <p className="text-sm text-primary-100">Patient-doctor coordination</p>
            </div>
          </div>

          <div className="my-auto space-y-6">
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary-50">
              Clinical premium
            </span>
            <h2 className="max-w-md font-display text-4xl font-semibold leading-tight tracking-tight">
              Calm, trustworthy care workflows for appointments, records, and profiles.
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-primary-50/80">
              HERMES brings patient scheduling, doctor availability, and appointment-linked
              records into one role-aware workspace without leaving the browser.
            </p>
            <ul className="space-y-3 text-sm text-primary-50/80">
              <li>Role-based dashboards tailored for patients and doctors</li>
              <li>Secure records linked directly to appointment history</li>
              <li>Availability-driven booking with clear clinical context</li>
            </ul>
          </div>
        </aside>

        <section className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <span className="mb-3 inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
                {eyebrow}
              </span>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              {description ? (
                <p className="mt-3 text-base leading-relaxed text-slate-500">{description}</p>
              ) : null}
            </div>

            <div className="space-y-6">{children}</div>
            {footer ? <div className="mt-6 text-sm text-slate-500">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
