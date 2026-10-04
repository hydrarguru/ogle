import type { CacheEntry, PersistentStore } from './cache'

/** In-memory PersistentStore for tests. */
export class FakeStore implements PersistentStore {
  data = new Map<string, CacheEntry>()
  failWrites = false
  async get(key: string) {
    return this.data.get(key)
  }
  async set(key: string, entry: CacheEntry) {
    if (this.failWrites) throw new Error('quota')
    this.data.set(key, entry)
  }
  async delete(key: string) {
    this.data.delete(key)
  }
  async entries() {
    return [...this.data].map(([key, e]) => ({ key, storedAt: e.storedAt }))
  }
  async clear() {
    this.data.clear()
  }
}
