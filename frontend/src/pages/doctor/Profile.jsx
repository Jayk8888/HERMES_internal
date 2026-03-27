import PageLayout from '../../components/layout/PageLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import { supabase } from '../../lib/supabase'

export default function DoctorProfile() {
  const { data, loading, error, refetch } = useFetch(() =>
    supabase.from('').select('*').then(r => {
      if (r.error) throw r.error
      return r.data
    })
  )

  return (
    <PageLayout>
      <h1>Doctor Profile</h1>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}
      {data && <p>Data loaded</p>}
    </PageLayout>
  )
}
