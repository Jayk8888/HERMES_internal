import Skeleton from './Skeleton'

export default function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar-bg px-4 py-5 lg:block">
        <Skeleton className="mb-8 h-10 w-36 bg-white/10" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
        </div>
      </aside>

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <Skeleton className="mb-6 h-16 w-full rounded-3xl bg-white" />
        <div className="mx-auto max-w-screen-xl space-y-6">
          <Skeleton className="h-44 w-full rounded-[28px] bg-white" />
          <div className="grid gap-5 md:grid-cols-3">
            <Skeleton className="h-36 rounded-[28px] bg-white" />
            <Skeleton className="h-36 rounded-[28px] bg-white" />
            <Skeleton className="h-36 rounded-[28px] bg-white" />
          </div>
          <Skeleton className="h-64 rounded-[28px] bg-white" />
        </div>
      </div>
    </div>
  )
}
