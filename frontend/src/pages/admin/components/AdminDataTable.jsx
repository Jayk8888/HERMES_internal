import { Link } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import StatusBadge from '../../../components/ui/StatusBadge'

export default function AdminDataTable({ columns, rows, emptyTitle, emptyDescription }) {
  if (!rows.length) {
    return (
      <Card tone="subtle" className="text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-900">{emptyTitle}</p>
        <p className="mt-1">{emptyDescription}</p>
      </Card>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map(column => (
                <th key={column.key} className="px-4 py-3 text-left font-semibold text-slate-600">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(row => (
              <tr key={row.id} className="align-top">
                {columns.map(column => {
                  const value = typeof column.render === 'function'
                    ? column.render(row)
                    : row[column.key]

                  return (
                    <td key={column.key} className="px-4 py-3 text-slate-700">
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminLinkCell({ to, primary, secondary }) {
  return (
    <div className="min-w-[180px]">
      <Link className="font-semibold text-primary-700 hover:text-primary-800" to={to}>
        {primary}
      </Link>
      {secondary ? <p className="mt-1 text-xs text-slate-500">{secondary}</p> : null}
    </div>
  )
}

export function AdminStatusCell({ status, children, tone }) {
  return <StatusBadge status={status} tone={tone}>{children}</StatusBadge>
}
