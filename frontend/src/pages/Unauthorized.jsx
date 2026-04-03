import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/layout/AuthShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth.jsx'
import { signOut } from '../features/auth/authService.js'

export default function Unauthorized() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <AuthShell
      eyebrow="Access control"
      title="Access denied"
      description="This page is restricted to a different role, or your current session no longer matches the route requirements."
      footer={(
        <>
          Need to switch accounts?{' '}
          <Link className="font-semibold text-primary-700 hover:text-primary-800" to="/login">
            Go to sign in
          </Link>
        </>
      )}
    >
      <Card tone="subtle" className="space-y-5">
        <p className="text-sm leading-relaxed text-slate-600">
          You can return to the correct dashboard for your active role or sign out and authenticate with a different account.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button as={Link} to={profile?.role === 'doctor' ? '/doctor' : '/patient'}>
            Go to my dashboard
          </Button>
          <Button variant="secondary" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </Card>
    </AuthShell>
  )
}
