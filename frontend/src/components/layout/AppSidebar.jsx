import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CalendarPlus2,
  ClipboardPlus,
  Clock3,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { signOut } from '../../features/auth/authService'
import { cn } from '../../lib/cn'
import { getNavigationForRole } from '../../routes/route-config'
import Button from '../ui/Button'

const ICONS = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  'calendar-plus': CalendarPlus2,
  records: ClipboardPlus,
  stethoscope: Stethoscope,
  user: UserRound,
  users: Users,
  clock: Clock3,
}

function matchesPath(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

function groupNavigationItems(items) {
  return items.reduce((groups, item) => {
    const group = item.handle.navGroup ?? 'Workspace'

    if (!groups[group]) {
      groups[group] = []
    }

    groups[group].push(item)
    return groups
  }, {})
}

export default function AppSidebar({ role, mobile = false, onClose }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const navigation = getNavigationForRole(role)
  const groups = groupNavigationItems(navigation)

  async function handleSignOut() {
    await signOut()
    onClose?.()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-text',
        mobile ? 'h-full' : 'sticky top-0 h-screen',
        mobile && 'shadow-2xl'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
        <Link
          to={role === 'doctor' ? '/doctor' : '/patient'}
          className="flex items-center gap-3 text-sidebar-textActive no-underline"
          onClick={() => onClose?.()}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 font-display text-lg font-bold text-white">
            H
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold tracking-tight text-sidebar-textActive">
              HERMES
            </p>
            <p className="truncate text-xs text-sidebar-text">Clinical workspace</p>
          </div>
        </Link>

        {mobile ? (
          <button
            type="button"
            className="rounded-lg p-2 text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-textActive focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-sidebar-bg"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-sidebar-text">
              {group}
            </p>
            <div className="space-y-1">
              {items.map(item => {
                const Icon = ICONS[item.handle.iconKey] ?? LayoutDashboard
                const isActive = matchesPath(pathname, item.path)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose?.()}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-colors',
                      isActive
                        ? 'bg-sidebar-active text-sidebar-textActive'
                        : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-textActive'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary-200' : 'text-sidebar-text')} />
                    <span className="truncate">{item.handle.navLabel}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="secondary"
          className="w-full justify-center border-sidebar-border bg-transparent text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-textActive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
