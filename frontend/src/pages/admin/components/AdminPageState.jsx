import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import Skeleton from '../../../components/ui/Skeleton'

function PanelSkeleton({ className = '' }) {
  return (
    <Card className={className}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </Card>
  )
}

function GridTableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-20 rounded-md" />
          ))}
        </div>
      </div>
      <div className="space-y-4 px-4 py-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton key={columnIndex} className="h-5 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function QueueSkeleton() {
  return (
    <Card>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MetricCardSkeleton() {
  return (
    <Card tone="subtle">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-3 w-40 rounded-md" />
      </div>
    </Card>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <MetricCardSkeleton key={index} />)}
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <MetricCardSkeleton key={index} />)}
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <QueueSkeleton />
        <QueueSkeleton />
        <QueueSkeleton />
      </section>
    </div>
  )
}

export function AdminUsersSkeleton() {
  return (
    <div className="space-y-6">
      <Card tone="subtle">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
      <GridTableSkeleton rows={6} columns={5} />
    </div>
  )
}

export function AdminUserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <PanelSkeleton />
      <PanelSkeleton />
      <div className="flex justify-end">
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  )
}

export function AdminAppointmentsSkeleton() {
  return (
    <div className="space-y-6">
      <PanelSkeleton />
      <Card tone="subtle">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </Card>
      <GridTableSkeleton rows={6} columns={5} />
    </div>
  )
}

export function AdminAppointmentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <PanelSkeleton />
      <PanelSkeleton />
      <div className="flex justify-end">
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  )
}

export function AdminRecordsSkeleton() {
  return (
    <div className="space-y-6">
      <PanelSkeleton />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <QueueSkeleton />
        <GridTableSkeleton rows={5} columns={3} />
      </div>
    </div>
  )
}

export function AdminRecordDetailSkeleton() {
  return (
    <div className="space-y-6">
      <PanelSkeleton />
      <PanelSkeleton />
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export function AdminAvailabilitySkeleton() {
  return (
    <div className="space-y-6">
      <PanelSkeleton />
      <PanelSkeleton />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={index}>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AdminProfileSkeleton() {
  return (
    <div className="space-y-6">
      <PanelSkeleton />
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
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