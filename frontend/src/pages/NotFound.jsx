import { Link } from 'react-router-dom'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function NotFound() {
  return (
    <div style={{ maxWidth: 640, margin: '80px auto', padding: '0 1rem' }}>
      <ErrorMessage message='404 Not Found. The page you requested does not exist.' />
      <div style={{ marginTop: '1rem' }}>
        <Link to="/">Go back home</Link>
      </div>
    </div>
  )
}
