import { CalendarDays, ClipboardList, ShieldAlert, Stethoscope, UserRound, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import MetricCard from '../../components/ui/MetricCard'
import { useFetch } from '../../hooks/useFetch'
import AdminQueueList from './components/AdminQueueList'
import { AdminErrorState, AdminLoadingState } from './components/AdminPageState'
import { loadAdminDashboard } from './lib/loaders'

export default function AdminDashboard() {
  const { data, loading, error, refetch } = useFetch(loadAdminDashboard, [])

  if (loading) {
    return (
      <PageLayout width="wide">
        <AdminLoadingState />
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

  const metrics = data.metrics

  return (
    <PageLayout
      width="wide"
      actions={(
        <>
          <Button as={Link} to="/admin/users" variant="secondary" size="small">Users</Button>
          <Button as={Link} to="/admin/appointments" variant="secondary" size="small">Appointments</Button>
          <Button as={Link} to="/admin/records" variant="secondary" size="small">Records</Button>
          <Button as={Link} to="/admin/availability" size="small">Availability</Button>
        </>
      )}
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Patients" value={metrics.patientCount} icon={<Users className="h-5 w-5" />} />
          <MetricCard label="Doctors" value={metrics.doctorCount} icon={<Stethoscope className="h-5 w-5" />} />
          <MetricCard label="Admins" value={metrics.adminCount} icon={<UserRound className="h-5 w-5" />} />
          <MetricCard label="Today appts" value={metrics.todayAppointments} icon={<CalendarDays className="h-5 w-5" />} />
          <MetricCard label="Total records" value={metrics.totalRecords} icon={<ClipboardList className="h-5 w-5" />} />
          <MetricCard label="Completed" value={metrics.completedAppointments} tone="success" />
          <MetricCard label="Cancelled" value={metrics.cancelledAppointments} tone="warning" />
          <MetricCard label="Missing records" value={metrics.missingRecords} tone="warning" />
          <MetricCard label="No availability" value={metrics.doctorsWithoutAvailability} tone="warning" />
          <MetricCard label="Broken links" value={metrics.brokenLinks} tone="critical" icon={<ShieldAlert className="h-5 w-5" />} />
        </section>

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
