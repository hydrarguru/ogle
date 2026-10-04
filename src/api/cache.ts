export interface CacheEntry {
  value: unknown
  storedAt: number
}

/**
 * Durable storage behind the in-memory layer. Kept as an interface so the
 * browser Cache API can be swapped for something else (and faked in tests).
 */
export interface PersistentStore {
  get(key: string): Promise<CacheEntry | undefined>
  set(key: string, entry: CacheEntry): Promise<void>
  delete(key: string): Promise<void>
  entries(): Promise<{ key: string; storedAt: number }[]>
  clear(): Promise<void>
}

/** Used when the Cache API is unavailable (insecure context, some private modes). */
export class NullStore implements PersistentStore {
  async get() {
    return undefined
  }
  async set() {}
  async delete() {}
  async entries() {
    return []
  }
  async clear() {}
}

/**
 * Persists entries with the browser Cache API rather than localStorage, so a
 * large cache can never eat into the quota the personal library relies on.
 */
export class CacheApiStore implements PersistentStore {
  constructor(private readonly name = 'ogle-rawg-v1') {}

  private open() {
    return caches.open(this.name)
  }

  async get(key: string) {
    const response = await (await this.open()).match(key)
    if (!response) return undefined
    try {
      return (await response.json()) as CacheEntry
    } catch {
      return undefined
    }
  }

  async set(key: string, entry: CacheEntry) {
    const response = new Response(JSON.stringify(entry), {
      headers: { 'content-type': 'application/json', 'x-stored-at': String(entry.storedAt) },
    })
    await (await this.open()).put(key, response)
  }

  async delete(key: string) {
    await (await this.open()).delete(key)
  }

  async entries() {
    const cache = await this.open()
    const requests = await cache.keys()
    return Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request)
        return { key: request.url, storedAt: Number(response?.headers.get('x-stored-at')) || 0 }
      }),
    )
  }

  async clear() {
    await caches.delete(this.name)
  }
}

export function createPersistentStore(): PersistentStore {
  return typeof caches === 'undefined' ? new NullStore() : new CacheApiStore()
}

const MAX_MEMORY_ENTRIES = 200

/** Two-tier (memory + persistent) cache. Persistence failures never surface to callers. */
export class ResponseCache {
  private readonly memory = new Map<string, CacheEntry>()

  constructor(
    private readonly store: PersistentStore,
    private readonly now: () => number = Date.now,
  ) {}

  /** Returns the entry whether or not it is still fresh; use `isFresh` to decide. */
  async lookup(key: string): Promise<CacheEntry | undefined> {
    const inMemory = this.memory.get(key)
    if (inMemory) return inMemory
    try {
      const stored = await this.store.get(key)
      if (stored && typeof stored.storedAt === 'number') {
        this.remember(key, stored)
        return stored
      }
    } catch {
      /* treat as a miss */
    }
    return undefined
  }

  isFresh(entry: CacheEntry, ttlMs: number) {
    return this.now() - entry.storedAt < ttlMs
  }

  async put(key: string, value: unknown) {
    const entry = { value, storedAt: this.now() }
    this.remember(key, entry)
    try {
      await this.store.set(key, entry)
    } catch {
      /* quota exceeded or storage unavailable: the memory copy still works */
    }
  }

  private remember(key: string, entry: CacheEntry) {
    this.memory.delete(key)
    this.memory.set(key, entry)
    if (this.memory.size > MAX_MEMORY_ENTRIES) this.memory.delete(this.memory.keys().next().value!)
  }

  /** Forgets the in-memory layer only, as a page reload would. */
  clearMemory() {
    this.memory.clear()
  }

  async clear() {
    this.memory.clear()
    try {
      await this.store.clear()
    } catch {
      /* ignore */
    }
  }

  /** Drops entries older than `maxAgeMs`, then the oldest ones beyond `maxEntries`. */
  async prune(maxAgeMs: number, maxEntries: number) {
    try {
      const entries = await this.store.entries()
      const cutoff = this.now() - maxAgeMs
      const expired = entries.filter((e) => e.storedAt < cutoff)
      const live = entries.filter((e) => e.storedAt >= cutoff).sort((a, b) => a.storedAt - b.storedAt)
      const overflow = live.slice(0, Math.max(0, live.length - maxEntries))
      await Promise.all([...expired, ...overflow].map((e) => this.store.delete(e.key)))
    } catch {
      /* ignore */
    }
  }
}
