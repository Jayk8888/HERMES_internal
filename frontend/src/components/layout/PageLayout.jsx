import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/cn'
import AppSidebar from './AppSidebar'
import AppTopbar from './AppTopbar'

const WIDTHS = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-screen-xl',
}

export default function PageLayout({
  children,
  width = 'default',
  actions,
  titleOverride,
  className,
}) {
  const { profile } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const role = profile?.role === 'doctor' ? 'doctor' : 'patient'

  return (
    <div className="h-screen overflow-hidden bg-canvas">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <div className="flex h-full">
        <div className="hidden h-screen shrink-0 lg:block">
          <AppSidebar role={role} />
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <button
              type="button"
              className="flex-1 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation overlay"
            />
            <div className="relative z-50 h-full">
              <AppSidebar role={role} mobile onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppTopbar
            role={role}
            onMenuToggle={() => setMobileOpen(true)}
            actions={actions}
            titleOverride={titleOverride}
          />

          <main id="main-content" className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
            <div className={cn('mx-auto w-full', WIDTHS[width] ?? WIDTHS.default, className)}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
