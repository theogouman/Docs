import { downloadZip } from 'client-zip'
import { pdfUrl } from './pdf'
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

/**
 * Télécharge un ensemble de documents dans une archive ZIP.
 * Chaque PDF est récupéré via /api/pdf/[id] (même origine, donc aucun
 * souci de CORS) puis ajouté à l'archive. Le ZIP est assemblé côté client,
 * ce qui évite les limites de taille/durée des fonctions serverless.
 */
export async function downloadDocsAsZip(
  docs: DocItem[],
  zipName: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const files: { name: string; input: Blob; lastModified: Date }[] = []
  let done = 0
  for (const doc of docs) {
    const res = await fetch(pdfUrl(doc))
    if (!res.ok) throw new Error(`Échec du téléchargement : ${doc.name}`)
    files.push({
      name: doc.file,
      input: await res.blob(),
      lastModified: doc.date ? new Date(doc.date) : new Date(),
    })
    done += 1
    onProgress?.(done, docs.length)
  }
  const zipBlob = await downloadZip(files).blob()
  triggerBlobDownload(zipBlob, zipName)
}
