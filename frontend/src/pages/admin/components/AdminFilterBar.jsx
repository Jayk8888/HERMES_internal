import Card from '../../../components/ui/Card'

export default function AdminFilterBar({ children }) {
  return (
    <Card tone="subtle">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </Card>
  )
}
