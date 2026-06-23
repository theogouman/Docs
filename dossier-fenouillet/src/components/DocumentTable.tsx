import type { DocItem } from '../lib/types'
import { formatDate } from '../lib/format'
import Badge from './Badge'
import DocActions from './DocActions'

interface Props {
  docs: DocItem[]
  onOpenDetail: (doc: DocItem) => void
}

export default function DocumentTable({ docs, onOpenDetail }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th scope="col" className="px-4 py-3">Nom</th>
            <th scope="col" className="px-4 py-3">Type</th>
            <th scope="col" className="hidden px-4 py-3 lg:table-cell">Résumé</th>
            <th scope="col" className="hidden px-4 py-3 sm:table-cell">Date</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {docs.map((doc) => (
            <tr key={doc.id} className="align-top hover:bg-gray-50">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpenDetail(doc)}
                  className="text-left font-medium text-gray-900 hover:text-blue-700"
                >
                  {doc.name}
                </button>
              </td>
              <td className="px-4 py-3">
                <Badge type={doc.type} />
              </td>
              <td className="hidden max-w-md px-4 py-3 text-gray-600 lg:table-cell">
                <span className="line-clamp-2">{doc.summary}</span>
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-gray-500 sm:table-cell">
                {doc.date ? formatDate(doc.date) : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <DocActions doc={doc} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
