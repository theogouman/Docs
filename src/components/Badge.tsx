import { colorStyle } from '../lib/types'
import { useTypeColor } from '../lib/categories'

export default function Badge({ type }: { type: string }) {
  const colorFor = useTypeColor()
  const style = colorStyle(colorFor(type))
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      <span className="truncate">{type}</span>
    </span>
  )
}
