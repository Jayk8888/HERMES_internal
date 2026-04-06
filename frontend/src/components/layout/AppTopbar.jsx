import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { findActiveNavigationItem, findRouteDefinition } from '../../routes/route-config'
import Avatar from '../ui/Avatar'
import IconButton from '../ui/IconButton'

export default function AppTopbar({ role, onMenuToggle, actions, titleOverride }) {
  const { pathname } = useLocation()
  const { profile } = useAuth()
  const matchedRoute = findRouteDefinition(pathname, role)
  const activeItem = findActiveNavigationItem(role, pathname)
  const title = titleOverride || matchedRoute?.handle?.title || activeItem?.handle?.navLabel || 'Workspace'

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <IconButton
        className="lg:hidden"
        onClick={onMenuToggle}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </IconButton>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {actions ? <div className="hidden items-center gap-3 md:flex">{actions}</div> : null}
        <div className="hidden items-center gap-3 pl-1 sm:flex">
          <Avatar name={profile?.full_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {profile?.full_name ?? 'Signed in user'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
