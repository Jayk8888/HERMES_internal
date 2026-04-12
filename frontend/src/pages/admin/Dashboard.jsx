import PageLayout from '../../components/layout/PageLayout'
import { useFetch } from '../../hooks/useFetch'
import AdminQueueList from './components/AdminQueueList'
import { AdminDashboardSkeleton, AdminErrorState } from './components/AdminPageState'
import { loadAdminDashboard } from './lib/loaders'

export default function AdminDashboard() {
  const { data, loading, error, refetch } = useFetch(loadAdminDashboard, [], {
    key: 'admin:dashboard',
  })

  if (loading) {
    return (
      <PageLayout width="wide">
        <AdminDashboardSkeleton />
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout width="wide">
        <AdminErrorState error={error} onRetry={refetch} />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      width="wide"
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-3">
          <AdminQueueList
            title="Upcoming appointments"
            description="Next six scheduled visits."
            items={data.upcomingAppointments}
            to={item => `/admin/appointments/${item.id}`}
            emptyLabel="No upcoming appointments."
            renderMeta={item => `${item.doctorName} with ${item.patientName} · ${item.scheduledLabel}`}
          />
          <AdminQueueList
            title="Completed needing records"
            description="Visits finished without clinical note."
            items={data.completedNeedingRecords}
            to={item => `/admin/appointments/${item.id}`}
            emptyLabel="No missing records."
            renderMeta={item => `${item.doctorName} · ${item.scheduledLabel}`}
          />
          <AdminQueueList
            title="Broken profile links"
            description="Profiles missing role table rows."
            items={data.brokenProfileLinks}
            to={item => `/admin/users/${item.id}`}
            emptyLabel="No integrity issues."
            renderMeta={item => `${item.role} · ${item.email}`}
          />
        </section>
      </div>
    </PageLayout>
  )
}
