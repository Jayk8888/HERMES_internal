import { matchPath } from 'react-router-dom'

export const routeDefinitions = [
  {
    path: '/',
    handle: {
      title: 'Routing',
      description: 'Checking your session and role-specific home destination.',
      shell: 'none',
      iconKey: 'dashboard',
    },
  },
  {
    path: '/login',
    handle: {
      title: 'Sign in',
      description: 'Access your patient or doctor workspace.',
      shell: 'auth',
      iconKey: 'log-in',
    },
  },
  {
    path: '/signup',
    handle: {
      title: 'Create account',
      description: 'Create a patient or doctor account in HERMES.',
      shell: 'auth',
      iconKey: 'user-plus',
    },
  },
  {
    path: '/forgot-password',
    handle: {
      title: 'Forgot password',
      description: 'Request a password reset email.',
      shell: 'auth',
      iconKey: 'shield',
    },
  },
  {
    path: '/reset-password',
    handle: {
      title: 'Reset password',
      description: 'Choose a new password for your account.',
      shell: 'auth',
      iconKey: 'shield',
    },
  },
  {
    path: '/unauthorized',
    handle: {
      title: 'Access denied',
      description: 'Your current session does not match the required route access.',
      shell: 'auth',
      iconKey: 'shield',
    },
  },
  {
    path: '/patient/complete-profile',
    handle: {
      title: 'Patient setup',
      description: 'Complete the required patient profile details.',
      shell: 'auth',
      iconKey: 'user',
    },
  },
  {
    path: '/doctor/complete-profile',
    handle: {
      title: 'Doctor setup',
      description: 'Complete your clinical credentials and profile.',
      shell: 'auth',
      iconKey: 'stethoscope',
    },
  },
  {
    path: '/patient',
    role: 'patient',
    handle: {
      title: 'Patient dashboard',
      description: 'Monitor your appointments, doctors, and record activity.',
      shell: 'app',
      navLabel: 'Dashboard',
      navGroup: 'Workspace',
      navOrder: 1,
      iconKey: 'dashboard',
    },
  },
  {
    path: '/patient/appointments',
    role: 'patient',
    handle: {
      title: 'Appointments',
      description: 'Review upcoming and historical appointments.',
      shell: 'app',
      navLabel: 'Appointments',
      navGroup: 'Care',
      navOrder: 2,
      iconKey: 'calendar',
    },
  },
  {
    path: '/patient/appointments/book',
    role: 'patient',
    handle: {
      title: 'Book appointment',
      description: 'Choose a doctor, date, and available time slot.',
      shell: 'app',
      iconKey: 'calendar-plus',
    },
  },
  {
    path: '/patient/appointments/:id',
    role: 'patient',
    handle: {
      title: 'Appointment detail',
      description: 'Review doctor details, timing, and current appointment status.',
      shell: 'app',
      iconKey: 'calendar',
    },
  },
  {
    path: '/patient/records',
    role: 'patient',
    handle: {
      title: 'Records',
      description: 'Review your clinical notes, prescriptions, and vitals.',
      shell: 'app',
      navLabel: 'Records',
      navGroup: 'Care',
      navOrder: 3,
      iconKey: 'records',
    },
  },
  {
    path: '/patient/records/:id',
    role: 'patient',
    handle: {
      title: 'Record detail',
      description: 'Review a specific medical record and appointment context.',
      shell: 'app',
      iconKey: 'records',
    },
  },
  {
    path: '/patient/doctors',
    role: 'patient',
    handle: {
      title: 'Connected doctors',
      description: 'View the doctors connected to your appointment history.',
      shell: 'app',
      navLabel: 'Doctors',
      navGroup: 'Directory',
      navOrder: 4,
      iconKey: 'stethoscope',
    },
  },
  {
    path: '/patient/profile',
    role: 'patient',
    handle: {
      title: 'Patient profile',
      description: 'Review and update your patient identity details.',
      shell: 'app',
      navLabel: 'Profile',
      navGroup: 'Account',
      navOrder: 5,
      iconKey: 'user',
    },
  },
  {
    path: '/doctor',
    role: 'doctor',
    handle: {
      title: 'Doctor dashboard',
      description: 'Focus on today’s scheduled appointments and patient activity.',
      shell: 'app',
      navLabel: 'Dashboard',
      navGroup: 'Workspace',
      navOrder: 1,
      iconKey: 'dashboard',
    },
  },
  {
    path: '/doctor/appointments',
    role: 'doctor',
    handle: {
      title: 'Appointments',
      description: 'Manage your upcoming, completed, and cancelled visits.',
      shell: 'app',
      navLabel: 'Appointments',
      navGroup: 'Clinical',
      navOrder: 2,
      iconKey: 'calendar',
    },
  },
  {
    path: '/doctor/appointments/:id',
    role: 'doctor',
    handle: {
      title: 'Appointment detail',
      description: 'Update appointment status and create the related medical record.',
      shell: 'app',
      iconKey: 'calendar',
    },
  },
  {
    path: '/doctor/records/:id',
    role: 'doctor',
    handle: {
      title: 'Record editor',
      description: 'Review and update the clinical record for an appointment.',
      shell: 'app',
      iconKey: 'records',
    },
  },
  {
    path: '/doctor/patients',
    role: 'doctor',
    handle: {
      title: 'Patients',
      description: 'Browse patients linked to your active appointment history.',
      shell: 'app',
      navLabel: 'Patients',
      navGroup: 'Clinical',
      navOrder: 3,
      iconKey: 'users',
    },
  },
  {
    path: '/doctor/patients/:id',
    role: 'doctor',
    handle: {
      title: 'Patient detail',
      description: 'Review patient demographics and your shared record history.',
      shell: 'app',
      iconKey: 'users',
    },
  },
  {
    path: '/doctor/availability',
    role: 'doctor',
    handle: {
      title: 'Availability',
      description: 'Set weekly availability windows for appointment booking.',
      shell: 'app',
      navLabel: 'Availability',
      navGroup: 'Operations',
      navOrder: 4,
      iconKey: 'clock',
    },
  },
  {
    path: '/doctor/profile',
    role: 'doctor',
    handle: {
      title: 'Doctor profile',
      description: 'Review and update your doctor identity and credentials.',
      shell: 'app',
      navLabel: 'Profile',
      navGroup: 'Account',
      navOrder: 5,
      iconKey: 'user',
    },
  },
  {
    path: '/admin',
    role: 'admin',
    handle: {
      title: 'Admin dashboard',
      description: 'Track users, appointments, records, and integrity gaps.',
      shell: 'app',
      navLabel: 'Dashboard',
      navGroup: 'Workspace',
      navOrder: 1,
      iconKey: 'dashboard',
    },
  },
  {
    path: '/admin/users',
    role: 'admin',
    handle: {
      title: 'Users',
      description: 'Search profiles, integrity issues, and role-linked details.',
      shell: 'app',
      navLabel: 'Users',
      navGroup: 'Workspace',
      navOrder: 2,
      iconKey: 'users',
    },
  },
  {
    path: '/admin/users/:id',
    role: 'admin',
    handle: {
      title: 'User detail',
      description: 'Review profile data and role-specific fields.',
      shell: 'app',
      iconKey: 'users',
    },
  },
  {
    path: '/admin/appointments',
    role: 'admin',
    handle: {
      title: 'Appointments',
      description: 'Create, filter, and manage scheduled visits.',
      shell: 'app',
      navLabel: 'Appointments',
      navGroup: 'Operations',
      navOrder: 3,
      iconKey: 'calendar',
    },
  },
  {
    path: '/admin/appointments/:id',
    role: 'admin',
    handle: {
      title: 'Appointment detail',
      description: 'Reschedule, change status, and review record linkage.',
      shell: 'app',
      iconKey: 'calendar',
    },
  },
  {
    path: '/admin/records',
    role: 'admin',
    handle: {
      title: 'Records',
      description: 'Fill queue gaps and edit clinical records.',
      shell: 'app',
      navLabel: 'Records',
      navGroup: 'Operations',
      navOrder: 4,
      iconKey: 'records',
    },
  },
  {
    path: '/admin/records/:id',
    role: 'admin',
    handle: {
      title: 'Record detail',
      description: 'Edit medical record content and context.',
      shell: 'app',
      iconKey: 'records',
    },
  },
  {
    path: '/admin/availability',
    role: 'admin',
    handle: {
      title: 'Availability',
      description: 'Manage weekly doctor slot boards.',
      shell: 'app',
      navLabel: 'Availability',
      navGroup: 'Operations',
      navOrder: 5,
      iconKey: 'clock',
    },
  },
  {
    path: '/admin/profile',
    role: 'admin',
    handle: {
      title: 'Profile',
      description: 'Update your own admin identity fields.',
      shell: 'app',
      navLabel: 'Profile',
      navGroup: 'Account',
      navOrder: 6,
      iconKey: 'shield',
    },
  },
]

export const navigationByRole = routeDefinitions.reduce((accumulator, route) => {
  if (!route.role || !route.handle?.navLabel) return accumulator

  const entry = {
    to: route.path,
    label: route.handle.navLabel,
    matches: [route.path],
    order: route.handle.navOrder ?? 999,
  }

  accumulator[route.role] = [...(accumulator[route.role] || []), entry]
  accumulator[route.role].sort((first, second) => first.order - second.order)
  return accumulator
}, {})

export function isNavItemActive(pathname, item) {
  return item.matches.some(match =>
    pathname === match || pathname.startsWith(`${match}/`)
  )
}

export function getNavigationForRole(role) {
  return routeDefinitions
    .filter(route => route.role === role && route.handle?.navLabel)
    .sort((first, second) => first.handle.navOrder - second.handle.navOrder)
}

export function findActiveNavigationItem(role, pathname) {
  const candidates = getNavigationForRole(role)

  return candidates.find(route =>
    pathname === route.path || pathname.startsWith(`${route.path}/`)
  )
}

export function findRouteDefinition(pathname, role) {
  const candidates = routeDefinitions.filter(route =>
    route.path &&
    (!route.role || route.role === role)
  )

  return candidates.find(route =>
    matchPath({ path: route.path, end: true }, pathname)
  )
}
