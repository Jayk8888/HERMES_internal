const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function mapById(rows) {
  return new Map((rows ?? []).map(row => [row.id, row]))
}

function safeDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDateTime(value) {
  const date = safeDate(value)
  if (!date) return 'Unknown'

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatDate(value) {
  const date = safeDate(value)
  if (!date) return 'Unknown'

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date)
}

function fullText(parts) {
  return parts.filter(Boolean).join(' ').trim().toLowerCase()
}

function buildUserIntegrity(profile, patient, doctor) {
  if (profile?.role === 'patient' && !patient) {
    return 'missing_patient'
  }

  if (profile?.role === 'doctor' && !doctor) {
    return 'missing_doctor'
  }

  return 'healthy'
}

function buildIntegrityLabel(integrity) {
  if (integrity === 'missing_patient') return 'Missing patient row'
  if (integrity === 'missing_doctor') return 'Missing doctor row'
  return 'Healthy'
}

export function buildAdminUserRows(base) {
  const patientMap = mapById(base.patients)
  const doctorMap = mapById(base.doctors)
  const appointmentsByUser = new Map()

  for (const appointment of base.appointments ?? []) {
    appointmentsByUser.set(
      appointment.patient_id,
      (appointmentsByUser.get(appointment.patient_id) ?? 0) + 1
    )
    appointmentsByUser.set(
      appointment.doctor_id,
      (appointmentsByUser.get(appointment.doctor_id) ?? 0) + 1
    )
  }

  return (base.profiles ?? []).map(profile => {
    const patient = patientMap.get(profile.id) ?? null
    const doctor = doctorMap.get(profile.id) ?? null
    const integrity = buildUserIntegrity(profile, patient, doctor)

    return {
      id: profile.id,
      fullName: profile.full_name ?? 'Unnamed user',
      email: profile.email ?? '',
      phoneNumber: profile.phone_number ?? '',
      gender: profile.gender ?? '',
      role: profile.role ?? 'unknown',
      patient,
      doctor,
      appointmentCount: appointmentsByUser.get(profile.id) ?? 0,
      integrity,
      integrityLabel: buildIntegrityLabel(integrity),
      searchableText: fullText([profile.full_name, profile.email]),
      statusTone: integrity === 'healthy' ? 'success' : 'warning',
    }
  }).sort((left, right) => left.fullName.localeCompare(right.fullName))
}

export function buildAdminAppointmentRows(base) {
  const userMap = new Map(buildAdminUserRows(base).map(row => [row.id, row]))
  const recordByAppointmentId = new Map((base.records ?? []).map(row => [row.appointment_id, row]))

  return (base.appointments ?? []).map(appointment => {
    const patient = userMap.get(appointment.patient_id) ?? null
    const doctor = userMap.get(appointment.doctor_id) ?? null
    const record = recordByAppointmentId.get(appointment.id) ?? null

    return {
      id: appointment.id,
      scheduledAt: appointment.scheduled_at,
      scheduledLabel: formatDateTime(appointment.scheduled_at),
      scheduledDate: formatDate(appointment.scheduled_at),
      status: appointment.status ?? 'scheduled',
      patientId: appointment.patient_id,
      doctorId: appointment.doctor_id,
      patientName: patient?.fullName ?? 'Unknown patient',
      doctorName: doctor?.fullName ?? 'Unknown doctor',
      patientEmail: patient?.email ?? '',
      doctorEmail: doctor?.email ?? '',
      hasRecord: Boolean(record),
      recordId: record?.id ?? null,
      recordStatus: record ? 'available' : 'missing',
      patient,
      doctor,
      record,
      sortTime: safeDate(appointment.scheduled_at)?.getTime() ?? 0,
    }
  }).sort((left, right) => left.sortTime - right.sortTime)
}

export function buildAdminRecordRows(base) {
  const appointmentMap = new Map(buildAdminAppointmentRows(base).map(row => [row.id, row]))

  return (base.records ?? []).map(record => {
    const appointment = appointmentMap.get(record.appointment_id) ?? null

    return {
      id: record.id,
      appointmentId: record.appointment_id,
      description: record.description ?? '',
      prescription: record.prescription ?? '',
      vitals: record.vitals ?? null,
      createdAt: record.created_at,
      createdLabel: formatDateTime(record.created_at),
      appointment,
      patientName: appointment?.patientName ?? 'Unknown patient',
      doctorName: appointment?.doctorName ?? 'Unknown doctor',
      status: appointment?.status ?? 'unknown',
      sortTime: safeDate(record.created_at)?.getTime() ?? 0,
    }
  }).sort((left, right) => right.sortTime - left.sortTime)
}

export function buildAdminAvailabilityRows(base) {
  const userMap = new Map(buildAdminUserRows(base).map(row => [row.id, row]))

  return (base.doctors ?? []).map(doctor => {
    const profile = userMap.get(doctor.id) ?? null
    const slots = (base.availability ?? [])
      .filter(slot => slot.doctor_id === doctor.id)
      .map(slot => ({
        id: slot.id,
        doctorId: slot.doctor_id,
        day: slot.day,
        startTime: slot.start_time,
        endTime: slot.end_time,
        label: `${slot.start_time} - ${slot.end_time}`,
      }))
      .sort((left, right) => {
        const dayDiff = DAY_ORDER.indexOf(left.day) - DAY_ORDER.indexOf(right.day)
        if (dayDiff !== 0) return dayDiff
        return left.startTime.localeCompare(right.startTime)
      })

    return {
      id: doctor.id,
      fullName: profile?.fullName ?? 'Unknown doctor',
      email: profile?.email ?? '',
      specialization: doctor.specialization ?? '',
      licenseNo: doctor.license_no ?? '',
      slots,
      slotCount: slots.length,
      hasAvailability: slots.length > 0,
      groupedSlots: DAY_ORDER.map(day => ({
        day,
        slots: slots.filter(slot => slot.day === day),
      })),
    }
  }).sort((left, right) => left.fullName.localeCompare(right.fullName))
}

export function buildAdminDashboardData(base) {
  const users = buildAdminUserRows(base)
  const appointments = buildAdminAppointmentRows(base)
  const records = buildAdminRecordRows(base)
  const availability = buildAdminAvailabilityRows(base)
  const todayKey = new Date().toDateString()

  const patientCount = users.filter(user => user.role === 'patient').length
  const doctorCount = users.filter(user => user.role === 'doctor').length
  const adminCount = users.filter(user => user.role === 'admin').length
  const todaysAppointments = appointments.filter(appointment => {
    const date = safeDate(appointment.scheduledAt)
    return date ? date.toDateString() === todayKey : false
  })
  const completedAppointments = appointments.filter(row => row.status === 'completed')
  const cancelledAppointments = appointments.filter(row => row.status === 'cancelled')
  const missingRecords = completedAppointments.filter(row => !row.hasRecord)
  const brokenLinks = users.filter(user => user.integrity !== 'healthy')
  const doctorsWithoutAvailability = availability.filter(row => !row.hasAvailability)

  return {
    metrics: {
      patientCount,
      doctorCount,
      adminCount,
      todayAppointments: todaysAppointments.length,
      completedAppointments: completedAppointments.length,
      cancelledAppointments: cancelledAppointments.length,
      totalRecords: records.length,
      missingRecords: missingRecords.length,
      doctorsWithoutAvailability: doctorsWithoutAvailability.length,
      brokenLinks: brokenLinks.length,
    },
    upcomingAppointments: appointments
      .filter(row => row.sortTime >= Date.now())
      .slice(0, 6),
    completedNeedingRecords: missingRecords.slice(0, 8),
    brokenProfileLinks: brokenLinks.slice(0, 8),
    users,
    appointments,
    records,
    availability,
    doctorsWithoutAvailability,
  }
}

export function filterUsers(users, { search = '', role = 'all' }) {
  const query = search.trim().toLowerCase()

  return users.filter(user => {
    const roleMatch =
      role === 'all' ||
      user.role === role ||
      (role === 'issues' && user.integrity !== 'healthy')

    const searchMatch =
      !query ||
      user.searchableText.includes(query)

    return roleMatch && searchMatch
  })
}

export function filterAppointments(rows, filters) {
  const queryDoctor = filters.doctorId ?? 'all'
  const queryPatient = filters.patientId ?? 'all'
  const queryStatus = filters.status ?? 'all'
  const queryDate = filters.date ?? ''

  return rows.filter(row => {
    const statusMatch = queryStatus === 'all' || row.status === queryStatus
    const doctorMatch = queryDoctor === 'all' || row.doctorId === queryDoctor
    const patientMatch = queryPatient === 'all' || row.patientId === queryPatient
    const dateMatch = !queryDate || row.scheduledAt?.slice(0, 10) === queryDate

    return statusMatch && doctorMatch && patientMatch && dateMatch
  })
}

export function splitRecordsForQueue(rows) {
  const completedMissing = rows
    .filter(row => !row.record && row.status === 'completed')
    .sort((left, right) => right.sortTime - left.sortTime)

  return {
    needsRecord: completedMissing,
    existingRecords: rows.filter(row => row.record || row.description),
  }
}

export function buildRecordQueue(appointments) {
  return appointments
    .filter(row => row.status === 'completed' && !row.hasRecord)
    .sort((left, right) => right.sortTime - left.sortTime)
}

export const ADMIN_DAY_ORDER = DAY_ORDER
