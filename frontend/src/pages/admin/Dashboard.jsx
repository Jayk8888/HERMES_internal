import {
  Activity,
  CalendarCheck2,
  CalendarX2,
  ClipboardList,
  Stethoscope,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Button from '../../components/ui/Button'
import MetricCard from '../../components/ui/MetricCard'
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

  const m = data.metrics

  return (
    <PageLayout
      width="wide"
      actions={(
        <Button as={Link} to="/admin/users" variant="secondary" size="small">
          Manage users
        </Button>
      )}
    >
      <div className="space-y-6">

        {/* ── KPI strip ── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total patients"
            value={m.patientCount}
            meta="Registered patient accounts"
            icon={<Users className="h-5 w-5" />}
          />
          <MetricCard
            label="Total doctors"
            value={m.doctorCount}
            meta="Active doctor accounts"
            icon={<Stethoscope className="h-5 w-5" />}
          />
          <MetricCard
            label="Today's appointments"
            value={m.todayAppointments}
            meta="Scheduled for today"
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            label="Admins"
            value={m.adminCount}
            meta="Admin accounts"
            icon={<Users className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Completed appointments"
            value={m.completedAppointments}
            meta={`${m.cancelledAppointments} cancelled`}
            icon={<CalendarCheck2 className="h-5 w-5" />}
          />
          <MetricCard
            label="Medical records"
            value={m.totalRecords}
            meta={`${m.missingRecords} missing record${m.missingRecords === 1 ? '' : 's'}`}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <MetricCard
            label="Integrity issues"
            value={m.brokenLinks}
            meta={`${m.doctorsWithoutAvailability} doctor${m.doctorsWithoutAvailability === 1 ? '' : 's'} without availability`}
            icon={<TriangleAlert className="h-5 w-5" />}
          />
        </section>

        {/* ── Action queues ── */}
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

        {/* ── Quick-links ── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'All users', to: '/admin/users', description: 'Search, filter, and edit any account.' },
            { label: 'Appointments', to: '/admin/appointments', description: 'Create visits and change statuses.' },
            { label: 'Records', to: '/admin/records', description: 'Fill missing records and edit notes.' },
            { label: 'Availability', to: '/admin/availability', description: 'Manage doctor weekly slot boards.' },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="group block rounded-2xl border border-slate-200/80 bg-white/82 p-5 no-underline shadow-[0_18px_42px_-34px_rgba(15,23,42,0.35)] transition duration-200 hover:border-primary-200 hover:bg-white/92 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)]"
            >
              <p className="font-semibold text-slate-900 group-hover:text-primary-700">
                {link.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{link.description}</p>
            </Link>
          ))}
        </section>

      </div>
    </PageLayout>
  )
}