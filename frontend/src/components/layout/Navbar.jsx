import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { signOut } from '../../features/auth/authService'

export default function Navbar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const isDoctor = profile?.role === 'doctor'
  const base = isDoctor ? '/doctor' : '/patient'

  // Common button styles for Nav Links
  const navButtonStyle = (path) => ({
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s',
    color: location.pathname === path ? '#0e7fa8' : '#4b5563',
    background: location.pathname === path ? '#f0f9ff' : 'transparent',
    border: 'none',
    cursor: 'pointer'
  })

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      height: 64,
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      background: 'white',
      zIndex: 10,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        <span style={{ 
          fontWeight: 700, 
          fontSize: 20, 
          color: '#0e7fa8', 
          letterSpacing: '-0.025em' 
        }}>
          HERMES
        </span>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={base} style={navButtonStyle(base)}>Dashboard</Link>
          <Link to={`${base}/appointments`} style={navButtonStyle(`${base}/appointments`)}>
            Appointments
          </Link>

          {isDoctor ? (
            <>
              <Link to="/doctor/patients" style={navButtonStyle('/doctor/patients')}>Patients</Link>
              <Link to="/doctor/availability" style={navButtonStyle('/doctor/availability')}>Availability</Link>
            </>
          ) : (
            <>
              <Link to="/patient/records" style={navButtonStyle('/patient/records')}>Records</Link>
              <Link to="/patient/doctors" style={navButtonStyle('/patient/doctors')}>Doctors</Link>
            </>
          )}

          <Link to={`${base}/profile`} style={navButtonStyle(`${base}/profile`)}>Profile</Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
            {profile?.full_name}
          </span>
          <span style={{
            fontSize: 10,
            padding: '1px 8px',
            borderRadius: 12,
            background: isDoctor ? '#dbeafe' : '#dcfce7',
            color: isDoctor ? '#1d4ed8' : '#15803d',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginTop: 2
          }}>
            {profile?.role}
          </span>
        </div>
        
        <button 
          onClick={handleSignOut}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#ef4444',
            background: 'white',
            border: '1px solid #fee2e2',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#fef2f2'}
          onMouseOut={(e) => e.target.style.background = 'white'}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}