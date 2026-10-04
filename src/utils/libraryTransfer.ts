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
  } catch (e) {
    const detail = e instanceof Error ? ` (${e.message})` : ''
    throw new ImportError(`This is not valid JSON${detail}.`)
  }
  const file = data as { format?: unknown; version?: unknown; entries?: unknown }
  if (!file || file.format !== EXPORT_FORMAT || !Array.isArray(file.entries)) {
    throw new ImportError(
      'This is not an OGLe library export: expected an object with "format": "ogle-library" and an "entries" array.',
    )
  }
  if (typeof file.version !== 'number' || file.version > EXPORT_VERSION) {
    throw new ImportError('This export was made by a newer version of OGLe.')
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

export interface FormatField {
  name: string
  type: string
  required: boolean
  note: string
}

/** Human-readable description of one library entry; kept in sync with `normalizeEntry` by tests. */
export const FORMAT_FIELDS: FormatField[] = [
  { name: 'id', type: 'number', required: true, note: 'RAWG game id: the number in a game page URL, e.g. /games/3498.' },
  { name: 'name', type: 'string', required: true, note: 'Game title.' },
  { name: 'status', type: 'string', required: true, note: `One of: ${LIBRARY_STATUSES.join(', ')}.` },
  { name: 'rating', type: 'number | null', required: false, note: 'Your rating from 1 to 5. Leave out for unrated.' },
  { name: 'hoursPlayed', type: 'number', required: false, note: 'Hours played, 0 to 99999. Defaults to 0.' },
  { name: 'notes', type: 'string', required: false, note: 'Up to 2000 characters.' },
  { name: 'image', type: 'string | null', required: false, note: 'Cover image URL (http or https).' },
  { name: 'released', type: 'string | null', required: false, note: 'Release date as YYYY-MM-DD.' },
  { name: 'genres', type: 'string[]', required: false, note: 'Genre names.' },
  { name: 'addedAt', type: 'string', required: false, note: 'ISO date-time. Defaults to now.' },
  {
    name: 'updatedAt',
    type: 'string',
    required: false,
    note: 'ISO date-time. Defaults to addedAt. If you already have the game, the newer copy wins.',
  },
]

/** A complete entry followed by one that only has the required fields. */
export const EXAMPLE_JSON = JSON.stringify(
  {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    entries: [
      {
        id: 4200,
        name: 'Portal 2',
        status: 'completed',
        rating: 5,
        hoursPlayed: 9.5,
        notes: 'Co-op was great.',
        image: 'https://media.rawg.io/media/games/328/3283617cb7d75d67257fc58339188742.jpg',
        released: '2011-04-18',
        genres: ['Puzzle', 'Action'],
        addedAt: '2024-01-15T18:30:00.000Z',
        updatedAt: '2024-02-01T20:00:00.000Z',
      },
      { id: 3328, name: 'The Witcher 3: Wild Hunt', status: 'backlog' },
    ],
  },
  null,
  2,
)
