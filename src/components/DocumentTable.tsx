import type { KeyboardEvent } from 'react'
import type { DocItem } from '../lib/types'
import { formatDate } from '../lib/format'
import Badge from './Badge'
import DocActions from './DocActions'

interface Props {
  docs: DocItem[]
  onOpenDetail: (doc: DocItem) => void
}

export default function DocumentTable({ docs, onOpenDetail }: Props) {
  function onRowKeyDown(e: KeyboardEvent, doc: DocItem) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onOpenDetail(doc)
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-4 py-3">Nom</th>
            <th scope="col" className="px-4 py-3">Type</th>
            <th scope="col" className="hidden px-4 py-3 lg:table-cell">Résumé</th>
            <th scope="col" className="hidden px-4 py-3 sm:table-cell">Date</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {docs.map((doc) => (
            <tr
              key={doc.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenDetail(doc)}
              onKeyDown={(e) => onRowKeyDown(e, doc)}
              className="cursor-pointer align-top transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{doc.name}</td>
              <td className="px-4 py-3">
                <Badge type={doc.type} />
              </td>
              <td className="hidden max-w-md px-4 py-3 text-gray-600 dark:text-gray-300 lg:table-cell">
                <span className="line-clamp-2">{doc.summary}</span>
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400 sm:table-cell">
                {doc.date ? formatDate(doc.date) : ''}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <DocActions doc={doc} variant="compact" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
