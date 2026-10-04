import { LIBRARY_STATUSES, type LibraryEntry } from '@/types/library'

/**
 * Persistence boundary for the personal library. The app only talks to this
 * interface, so localStorage can be replaced by a backend-backed
 * implementation (REST, Supabase, ...) without touching stores or views.
 */
export interface LibraryRepository {
  list(): Promise<LibraryEntry[]>
  save(entry: LibraryEntry): Promise<void>
  remove(gameId: number): Promise<void>
  /** Optional: notify when the data changed elsewhere (other tab, other device). */
  subscribe?(onChange: () => void): () => void
}

const STORAGE_KEY = 'ogle:library'
const SCHEMA_VERSION = 1

interface StoredLibrary {
  version: number
  entries: Record<string, LibraryEntry>
}

function isEntry(value: unknown): value is LibraryEntry {
  if (typeof value !== 'object' || value === null) return false
  const e = value as Record<string, unknown>
  return (
    typeof e.id === 'number' &&
    typeof e.name === 'string' &&
    typeof e.status === 'string' &&
    (LIBRARY_STATUSES as readonly string[]).includes(e.status) &&
    typeof e.hoursPlayed === 'number' &&
    typeof e.notes === 'string' &&
    Array.isArray(e.genres)
  )
}

export class LocalStorageLibraryRepository implements LibraryRepository {
  constructor(
    private readonly storage: Storage = window.localStorage,
    private readonly key: string = STORAGE_KEY,
  ) {}

  private read(): Record<string, LibraryEntry> {
    const raw = this.storage.getItem(this.key)
    if (!raw) return {}
    try {
      const parsed = JSON.parse(raw) as Partial<StoredLibrary>
      if (parsed.version !== SCHEMA_VERSION || typeof parsed.entries !== 'object' || !parsed.entries) return {}
      return Object.fromEntries(Object.entries(parsed.entries).filter(([, entry]) => isEntry(entry)))
    } catch {
      return {}
    }
  }

  private write(entries: Record<string, LibraryEntry>) {
    const payload: StoredLibrary = { version: SCHEMA_VERSION, entries }
    this.storage.setItem(this.key, JSON.stringify(payload))
  }

  async list() {
    return Object.values(this.read())
  }

  async save(entry: LibraryEntry) {
    const entries = this.read()
    entries[entry.id] = entry
    this.write(entries)
  }

  async remove(gameId: number) {
    const entries = this.read()
    delete entries[gameId]
    this.write(entries)
  }

  subscribe(onChange: () => void) {
    const handler = (event: StorageEvent) => {
      if (event.key === this.key || event.key === null) onChange()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }
}

let repository: LibraryRepository | undefined

export function getLibraryRepository(): LibraryRepository {
  repository ??= new LocalStorageLibraryRepository()
  return repository
}

/** Swap the persistence backend (also used by tests). */
export function setLibraryRepository(next: LibraryRepository) {
  repository = next
}
