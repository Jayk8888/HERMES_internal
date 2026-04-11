function isBlank(value) {
  return value == null || String(value).trim() === ''
}

export function validateAppointmentForm(values) {
  const errors = {}

  if (isBlank(values.patientId)) {
    errors.patientId = 'Patient required'
  }

  if (isBlank(values.doctorId)) {
    errors.doctorId = 'Doctor required'
  }

  if (values.patientId && values.doctorId && values.patientId === values.doctorId) {
    errors.doctorId = 'Patient and doctor must differ'
  }

  if (isBlank(values.scheduledAt)) {
    errors.scheduledAt = 'Date and time required'
  } else if (Number.isNaN(new Date(values.scheduledAt).getTime())) {
    errors.scheduledAt = 'Valid datetime required'
  }

  if (values.status && !['scheduled', 'completed', 'cancelled'].includes(values.status)) {
    errors.status = 'Invalid status'
  }

  return errors
}

export function validateMedicalRecordForm(values) {
  const errors = {}

  if (isBlank(values.appointmentId)) {
    errors.appointmentId = 'Appointment required'
  }

  if (isBlank(values.description)) {
    errors.description = 'Description required'
  }

  if (!isBlank(values.vitalsText)) {
    try {
      JSON.parse(values.vitalsText)
    } catch {
      errors.vitalsText = 'Vitals must be valid JSON'
    }
  }

  return errors
}

export function hasAvailabilityOverlap(slots, draft, excludeId = null) {
  return slots.some(slot => {
    if (excludeId && slot.id === excludeId) return false
    if (slot.day !== draft.day) return false

    const sameRange = slot.startTime === draft.startTime && slot.endTime === draft.endTime
    const overlaps = slot.startTime < draft.endTime && draft.startTime < slot.endTime

    return sameRange || overlaps
  })
}

export function validateAvailabilitySlot(values, slots, excludeId = null) {
  const errors = {}

  if (isBlank(values.doctorId)) {
    errors.doctorId = 'Doctor required'
  }

  if (isBlank(values.day)) {
    errors.day = 'Day required'
  }

  if (isBlank(values.startTime)) {
    errors.startTime = 'Start time required'
  }

  if (isBlank(values.endTime)) {
    errors.endTime = 'End time required'
  }

  if (!errors.startTime && !errors.endTime && values.startTime >= values.endTime) {
    errors.endTime = 'End must be after start'
  }

  if (Object.keys(errors).length === 0 && hasAvailabilityOverlap(slots, values, excludeId)) {
    errors.startTime = 'Slot overlaps existing range'
  }

  return errors
}
