import { createBrowserRouter } from 'react-router-dom'
import { RoleGuard } from './RoleGuard'

import Home from '../pages/Home'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import Unauthorized from '../pages/Unauthorized'

import PatientDashboard from '../pages/patient/Dashboard'
import BookAppointment from '../pages/patient/BookAppointment'
import PatientAppointments from '../pages/patient/Appointments'
import PatientAppointmentDetail from '../pages/patient/AppointmentDetail'
import PatientRecords from '../pages/patient/Records'
import PatientRecordDetail from '../pages/patient/RecordDetail'
import PatientDoctors from '../pages/patient/Doctors'
import PatientProfile from '../pages/patient/Profile'

import DoctorCompleteProfile from '../pages/doctor/CompleteProfile'
import DoctorDashboard from '../pages/doctor/Dashboard'
import DoctorAppointments from '../pages/doctor/Appointments'
import DoctorAppointmentDetail from '../pages/doctor/AppointmentDetail'
import DoctorRecordDetail from '../pages/doctor/RecordDetail'
import DoctorPatients from '../pages/doctor/Patients'
import DoctorPatientDetail from '../pages/doctor/PatientDetail'
import DoctorAvailability from '../pages/doctor/Availability'
import DoctorProfile from '../pages/doctor/Profile'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/unauthorized', element: <Unauthorized /> },

  {
    path: '/patient',
    element: <RoleGuard role="patient"><PatientDashboard /></RoleGuard>,
  },
  {
    path: '/patient/appointments',
    element: <RoleGuard role="patient"><PatientAppointments /></RoleGuard>,
  },
  {
    path: '/patient/appointments/book',
    element: <RoleGuard role="patient"><BookAppointment /></RoleGuard>,
  },
  {
    path: '/patient/appointments/:id',
    element: <RoleGuard role="patient"><PatientAppointmentDetail /></RoleGuard>,
  },
  {
    path: '/patient/records',
    element: <RoleGuard role="patient"><PatientRecords /></RoleGuard>,
  },
  {
    path: '/patient/records/:id',
    element: <RoleGuard role="patient"><PatientRecordDetail /></RoleGuard>,
  },
  {
    path: '/patient/doctors',
    element: <RoleGuard role="patient"><PatientDoctors /></RoleGuard>,
  },
  {
    path: '/patient/profile',
    element: <RoleGuard role="patient"><PatientProfile /></RoleGuard>,
  },

  {
    path: '/doctor',
    element: <RoleGuard role="doctor"><DoctorDashboard /></RoleGuard>,
  },
  {
    path: '/doctor/appointments',
    element: <RoleGuard role="doctor"><DoctorAppointments /></RoleGuard>,
  },
  {
    path: '/doctor/appointments/:id',
    element: <RoleGuard role="doctor"><DoctorAppointmentDetail /></RoleGuard>,
  },
  {
    path: '/doctor/records/:id',
    element: <RoleGuard role="doctor"><DoctorRecordDetail /></RoleGuard>,
  },
  {
    path: '/doctor/patients',
    element: <RoleGuard role="doctor"><DoctorPatients /></RoleGuard>,
  },
  {
    path: '/doctor/patients/:id',
    element: <RoleGuard role="doctor"><DoctorPatientDetail /></RoleGuard>,
  },
  {
    path: '/doctor/availability',
    element: <RoleGuard role="doctor"><DoctorAvailability /></RoleGuard>,
  },
  {
    path: '/doctor/profile',
    element: <RoleGuard role="doctor"><DoctorProfile /></RoleGuard>,
  },
  { path: '/doctor/complete-profile', element: <DoctorCompleteProfile /> },
])
