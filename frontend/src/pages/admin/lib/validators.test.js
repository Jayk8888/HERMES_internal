import { describe, expect, it } from 'vitest'
import {
  hasAvailabilityOverlap,
  validateAppointmentForm,
  validateAvailabilitySlot,
  validateMedicalRecordForm,
} from './validators'

describe('admin validators', () => {
  it('validates appointment form and catches same user ids', () => {
    expect(validateAppointmentForm({
      patientId: 'u1',
      doctorId: 'u1',
      scheduledAt: 'bad-date',
      status: 'weird',
    })).toEqual({
      doctorId: 'Patient and doctor must differ',
      scheduledAt: 'Valid datetime required',
      status: 'Invalid status',
    })
  })

  it('validates record form json', () => {
    expect(validateMedicalRecordForm({
      appointmentId: '',
      description: '',
      vitalsText: '{bad json}',
    })).toEqual({
      appointmentId: 'Appointment required',
      description: 'Description required',
      vitalsText: 'Vitals must be valid JSON',
    })
  })

  it('detects overlap and duplicate slot ranges', () => {
    const slots = [{ id: '1', day: 'Monday', startTime: '09:00', endTime: '10:00' }]
    expect(hasAvailabilityOverlap(slots, { day: 'Monday', startTime: '09:30', endTime: '10:30' })).toBe(true)
    expect(validateAvailabilitySlot({ doctorId: 'doc', day: 'Monday', startTime: '09:00', endTime: '10:00' }, slots)).toEqual({
      startTime: 'Slot overlaps existing range',
    })
  })
})
