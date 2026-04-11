import React from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout'
import Field from '../../components/ui/Field'
import Select from '../../components/ui/Select'
import TextInput from '../../components/ui/TextInput'
import { useFetch } from '../../hooks/useFetch'
import AdminDataTable, { AdminLinkCell, AdminStatusCell } from './components/AdminDataTable'
import AdminFilterBar from './components/AdminFilterBar'
import { AdminErrorState, AdminLoadingState } from './components/AdminPageState'
import { loadAdminUsers } from './lib/loaders'
import { filterUsers } from './lib/normalizers'
import Button from '../../components/ui/Button'

export default function AdminUsers() {
  const { data, loading, error, refetch } = useFetch(loadAdminUsers, [])
  const [search, setSearch] = React.useState('')
  const [role, setRole] = React.useState('all')

  if (loading) {
    return <PageLayout width="wide"><AdminLoadingState /></PageLayout>
  }

  if (error) {
    return <PageLayout width="wide"><AdminErrorState error={error} onRetry={refetch} /></PageLayout>
  }

  const rows = filterUsers(data, { search, role })

  return (
    <PageLayout
      width="wide"
      actions={<Button as={Link} to="/admin/profile" size="small" variant="secondary">My profile</Button>}
    >
      <div className="space-y-6">
        <AdminFilterBar>
          <Field label="Search">
            <TextInput
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Name or email"
            />
          </Field>
          <Field label="Filter">
            <Select value={role} onChange={event => setRole(event.target.value)}>
              <option value="all">All users</option>
              <option value="admin">Admins</option>
              <option value="doctor">Doctors</option>
              <option value="patient">Patients</option>
              <option value="issues">Integrity issues</option>
            </Select>
          </Field>
        </AdminFilterBar>

        <AdminDataTable
          columns={[
            {
              key: 'fullName',
              label: 'User',
              render: row => (
                <AdminLinkCell
                  to={`/admin/users/${row.id}`}
                  primary={row.fullName}
                  secondary={row.email}
                />
              ),
            },
            { key: 'role', label: 'Role' },
            { key: 'phoneNumber', label: 'Phone' },
            {
              key: 'integrity',
              label: 'Integrity',
              render: row => <AdminStatusCell tone={row.statusTone}>{row.integrityLabel}</AdminStatusCell>,
            },
            { key: 'appointmentCount', label: 'Appointments' },
          ]}
          rows={rows}
          emptyTitle="No users found"
          emptyDescription="Try broadening search or filters."
        />
      </div>
    </PageLayout>
  )
}
