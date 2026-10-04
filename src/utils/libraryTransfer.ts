import { LIBRARY_STATUSES, type LibraryEntry } from '@/types/library'

export const EXPORT_FORMAT = 'ogle-library'
export const EXPORT_VERSION = 1
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export interface ParsedImport {
  entries: LibraryEntry[]
  /** Records in the file that were malformed and ignored. */
  skipped: number
}

export class ImportError extends Error {}

export function serializeLibrary(entries: LibraryEntry[], now = new Date()): string {
  return JSON.stringify(
    { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: now.toISOString(), entries },
    null,
    2,
  )
}

export function exportFilename(now = new Date()): string {
  return `ogle-library-${now.toISOString().slice(0, 10)}.json`
}

const isoOr = (value: unknown, fallback: string) =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : fallback

/** Validates one untrusted record, clamping values the same way the store does. */
export function normalizeEntry(raw: unknown, now: string): LibraryEntry | null {
  if (typeof raw !== 'object' || raw === null) return null
  const e = raw as Record<string, unknown>
  if (!Number.isInteger(e.id) || (e.id as number) <= 0) return null
  if (typeof e.name !== 'string' || !e.name.trim()) return null
  if (typeof e.status !== 'string' || !(LIBRARY_STATUSES as readonly string[]).includes(e.status)) return null

  const rating = typeof e.rating === 'number' && Number.isFinite(e.rating) ? Math.min(5, Math.max(1, Math.round(e.rating))) : null
  const hours = typeof e.hoursPlayed === 'number' && Number.isFinite(e.hoursPlayed) ? e.hoursPlayed : 0
  const addedAt = isoOr(e.addedAt, now)

  return {
    id: e.id as number,
    name: e.name.slice(0, 300),
    image: typeof e.image === 'string' && /^https?:\/\//.test(e.image) ? e.image : null,
    released: typeof e.released === 'string' ? e.released.slice(0, 10) : null,
    genres: Array.isArray(e.genres) ? e.genres.filter((g): g is string => typeof g === 'string').slice(0, 20) : [],
    status: e.status as LibraryEntry['status'],
    rating,
    hoursPlayed: Math.min(99999, Math.max(0, Math.round(hours * 10) / 10)),
    notes: typeof e.notes === 'string' ? e.notes.slice(0, 2000) : '',
    addedAt,
    updatedAt: isoOr(e.updatedAt, addedAt),
  }
}

export function parseLibraryExport(text: string, now = new Date().toISOString()): ParsedImport {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ImportError('That file is not valid JSON.')
  }
  const file = data as { format?: unknown; version?: unknown; entries?: unknown }
  if (!file || file.format !== EXPORT_FORMAT || !Array.isArray(file.entries)) {
    throw new ImportError('That file is not an OGLe library export.')
  }
  if (typeof file.version !== 'number' || file.version > EXPORT_VERSION) {
    throw new ImportError('That export was made by a newer version of OGLe.')
  }
  // Last occurrence of a duplicate id wins.
  const byId = new Map<number, LibraryEntry>()
  let skipped = 0
  for (const raw of file.entries) {
    const entry = normalizeEntry(raw, now)
    if (entry) byId.set(entry.id, entry)
    else skipped++
  }
  return { entries: [...byId.values()], skipped }
}
