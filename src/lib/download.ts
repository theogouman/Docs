import { downloadZip } from 'client-zip'
import { pdfProxyUrl } from './pdf'
import type { DocItem } from './types'

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

interface ZipEntry {
  name: string
  input: Blob
  lastModified: Date
}

interface Options {
  onProgress?: (done: number, total: number) => void
  /** Range chaque PDF dans un sous-dossier nommé d'après sa catégorie. */
  foldersByType?: boolean
  /** Nombre de téléchargements simultanés (vitesse). */
  concurrency?: number
}

async function fetchEntry(doc: DocItem, foldersByType: boolean): Promise<ZipEntry> {
  const res = await fetch(pdfProxyUrl(doc))
  if (!res.ok) throw new Error(`Échec du téléchargement : ${doc.name}`)
  return {
    name: foldersByType ? `${doc.type}/${doc.file}` : doc.file,
    input: await res.blob(),
    lastModified: doc.date ? new Date(doc.date) : new Date(),
  }
}

/**
 * Télécharge un ensemble de documents dans une archive ZIP.
 * Les PDF sont récupérés EN PARALLÈLE via /api/pdf/[id]?proxy=1 (même origine,
 * donc aucun souci de CORS), puis assemblés côté client (sans limite de
 * taille/durée des fonctions serverless). Avec `foldersByType`, chaque
 * catégorie devient un sous-dossier contenant ses PDF.
 */
export async function downloadDocsAsZip(
  docs: DocItem[],
  zipName: string,
  { onProgress, foldersByType = false, concurrency = 6 }: Options = {},
): Promise<void> {
  const entries: ZipEntry[] = new Array(docs.length)
  let done = 0
  let next = 0

  async function worker() {
    for (;;) {
      const i = next++
      if (i >= docs.length) break
      entries[i] = await fetchEntry(docs[i], foldersByType)
      done += 1
      onProgress?.(done, docs.length)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, docs.length) }, worker)
  await Promise.all(workers)

  const zipBlob = await downloadZip(entries).blob()
  triggerBlobDownload(zipBlob, zipName)
}
