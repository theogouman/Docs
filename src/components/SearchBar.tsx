import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un document (nom ou contenu du résumé)…"
        aria-label="Rechercher un document"
        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
      />
    </div>
  )
}
