import AppShellSkeleton from '../../../components/ui/AppShellSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorMessage from '../../../components/ui/ErrorMessage'

export function AdminLoadingState() {
  return <AppShellSkeleton />
}

export function AdminErrorState({ error, onRetry }) {
  return <ErrorMessage message={error} onRetry={onRetry} />
}

export function AdminEmptyState({ title, description, action, icon }) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={action}
      icon={icon}
    />
  )
}
