import { describe, expect, it } from 'vitest'
import { buildAdminDashboardData, buildRecordQueue, filterUsers } from './normalizers'

const base = {
  profiles: [
    { id: 'admin-1', full_name: 'Admin One', email: 'admin@example.com', role: 'admin' },
    { id: 'doctor-1', full_name: 'Dr One', email: 'doctor@example.com', role: 'doctor' },
    { id: 'doctor-2', full_name: 'Dr Two', email: 'doctor2@example.com', role: 'doctor' },
    { id: 'patient-1', full_name: 'Patient One', email: 'patient@example.com', role: 'patient' },
    { id: 'patient-2', full_name: 'Patient Two', email: 'patient2@example.com', role: 'patient' },
  ],
  patients: [{ id: 'patient-1', dob: '1990-01-01' }],
  doctors: [
    { id: 'doctor-1', specialization: 'Cardiology', license_no: 'LIC-1' },
    { id: 'doctor-2', specialization: 'Neuro', license_no: 'LIC-2' },
  ],
  appointments: [
    { id: 'appt-1', patient_id: 'patient-1', doctor_id: 'doctor-1', scheduled_at: new Date().toISOString(), status: 'completed' },
    { id: 'appt-2', patient_id: 'patient-1', doctor_id: 'doctor-1', scheduled_at: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled' },
  ],
  records: [],
  availability: [{ id: 'slot-1', doctor_id: 'doctor-1', day: 'Monday', start_time: '09:00', end_time: '10:00' }],
}

describe('admin normalizers', () => {
  it('derives dashboard KPIs and broken links', () => {
    const data = buildAdminDashboardData(base)

    expect(data.metrics.adminCount).toBe(1)
    expect(data.metrics.doctorCount).toBe(2)
    expect(data.metrics.patientCount).toBe(2)
    expect(data.metrics.missingRecords).toBe(1)
    expect(data.metrics.doctorsWithoutAvailability).toBe(1)
    expect(data.metrics.brokenLinks).toBe(1)
  })

  it('filters users by issues and search', () => {
    const rows = buildAdminDashboardData(base).users

    expect(filterUsers(rows, { role: 'issues', search: '' })).toHaveLength(1)
    expect(filterUsers(rows, { role: 'all', search: 'admin@' })).toHaveLength(1)
  })

  it('builds needs-record queue from completed appointments without record', () => {
    const queue = buildRecordQueue(buildAdminDashboardData(base).appointments)
    expect(queue.map(item => item.id)).toEqual(['appt-1'])
  })
})
