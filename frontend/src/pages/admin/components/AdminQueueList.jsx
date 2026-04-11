import { Link } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import StatusBadge from '../../../components/ui/StatusBadge'

export default function AdminQueueList({ title, description, items, to, emptyLabel, renderMeta }) {
  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map(item => (
            <Link
              key={item.id}
              to={to(item)}
              className="block rounded-xl border border-slate-200 p-4 no-underline transition hover:border-primary-200 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {item.patientName || item.fullName || item.description}
                  </p>
                  {renderMeta ? <p className="mt-1 text-sm text-slate-500">{renderMeta(item)}</p> : null}
                </div>
                <StatusBadge status={item.status || item.integrity} tone={item.statusTone}>
                  {item.integrityLabel || item.status}
                </StatusBadge>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      )}
    </Card>
  )
}
