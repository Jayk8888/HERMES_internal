import { supabase } from '../../../lib/supabase'
import {
  buildAdminAppointmentRows,
  buildAdminAvailabilityRows,
  buildAdminDashboardData,
  buildAdminRecordRows,
  buildAdminUserRows,
} from './normalizers'

function unwrap(result, label) {
  if (result.error) {
    throw new Error(result.error.message || `Failed to load ${label}`)
  }

  return result.data ?? []
}

export async function loadAdminBaseData() {
  const [
    profilesResult,
    patientsResult,
    doctorsResult,
    appointmentsResult,
    recordsResult,
    availabilityResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('patients').select('*'),
    supabase.from('doctors').select('*'),
    supabase.from('appointments').select('*').order('scheduled_at', { ascending: true }),
    supabase.from('medical_records').select('*').order('created_at', { ascending: false }),
    supabase.from('availability').select('*').order('day', { ascending: true }).order('start_time', { ascending: true }),
  ])

  return {
    profiles: unwrap(profilesResult, 'profiles'),
    patients: unwrap(patientsResult, 'patients'),
    doctors: unwrap(doctorsResult, 'doctors'),
    appointments: unwrap(appointmentsResult, 'appointments'),
    records: unwrap(recordsResult, 'medical records'),
    availability: unwrap(availabilityResult, 'availability'),
  }
}

export async function loadAdminDashboard() {
  const base = await loadAdminBaseData()
  return buildAdminDashboardData(base)
}

export async function loadAdminUsers() {
  const base = await loadAdminBaseData()
  return buildAdminUserRows(base)
}

export async function loadAdminUserDetail(userId) {
  const rows = await loadAdminUsers()
  return rows.find(row => row.id === userId) ?? null
}

export async function loadAdminAppointments() {
  const base = await loadAdminBaseData()
  return buildAdminAppointmentRows(base)
}

export async function loadAdminAppointmentDetail(appointmentId) {
  const rows = await loadAdminAppointments()
  return rows.find(row => row.id === appointmentId) ?? null
}

export async function loadAdminRecords() {
  const base = await loadAdminBaseData()
  return buildAdminRecordRows(base)
}

export async function loadAdminRecordDetail(recordId) {
  const rows = await loadAdminRecords()
  return rows.find(row => String(row.id) === String(recordId)) ?? null
}

export async function loadAdminAvailability() {
  const base = await loadAdminBaseData()
  return buildAdminAvailabilityRows(base)
}

export async function loadOwnAdminProfile(userId) {
  const user = await loadAdminUserDetail(userId)

  if (!user) {
    throw new Error('Profile not found')
  }

  return user
}

export async function saveAdminUser(payload) {
  const { data, error } = await supabase.rpc('admin_save_user', payload)

  if (error) {
    throw new Error(error.message || 'Failed to save user')
  }

  return data
}

export async function createAdminAppointment(payload) {
  const { data, error } = await supabase.rpc('admin_create_appointment', payload)

  if (error) {
    throw new Error(error.message || 'Failed to create appointment')
  }

  return data
}

export async function updateAdminAppointment(payload) {
  const { data, error } = await supabase.rpc('admin_update_appointment', payload)

  if (error) {
    throw new Error(error.message || 'Failed to update appointment')
  }

  return data
}

export async function saveAdminMedicalRecord(payload) {
  const { data, error } = await supabase.rpc('admin_save_medical_record', payload)

  if (error) {
    throw new Error(error.message || 'Failed to save medical record')
  }

  return data
}

export async function createAvailabilitySlot(payload) {
  const { data, error } = await supabase
    .from('availability')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to create slot')
  }

  return data
}

export async function updateAvailabilitySlot(id, payload) {
  const { data, error } = await supabase
    .from('availability')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to update slot')
  }

  return data
}

export async function deleteAvailabilitySlot(id) {
  const { error } = await supabase.from('availability').delete().eq('id', id)

  if (error) {
    throw new Error(error.message || 'Failed to delete slot')
  }
}
