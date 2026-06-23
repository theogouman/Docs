import { TYPE_STYLES, type DocType } from '../lib/types'

export default function Badge({ type }: { type: DocType }) {
  const style = TYPE_STYLES[type]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {type}
    </span>
  )
}
