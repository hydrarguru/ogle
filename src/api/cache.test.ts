import { describe, expect, it } from 'vitest'
import { ResponseCache } from './cache'
import { FakeStore } from './fakeStore'

describe('ResponseCache', () => {
  it('reads through to the persistent store after memory is cleared', async () => {
    const store = new FakeStore()
    const cache = new ResponseCache(store, () => 1000)
    await cache.put('a', { n: 1 })
    cache.clearMemory()
    expect((await cache.lookup('a'))?.value).toEqual({ n: 1 })
  })

  it('judges freshness by ttl', async () => {
    let now = 0
    const cache = new ResponseCache(new FakeStore(), () => now)
    await cache.put('a', 1)
    const entry = (await cache.lookup('a'))!
    now = 99
    expect(cache.isFresh(entry, 100)).toBe(true)
    now = 100
    expect(cache.isFresh(entry, 100)).toBe(false)
  })

  it('keeps working in memory when persisting fails', async () => {
    const store = new FakeStore()
    store.failWrites = true
    const cache = new ResponseCache(store)
    await expect(cache.put('a', 1)).resolves.toBeUndefined()
    expect((await cache.lookup('a'))?.value).toBe(1)
  })

  it('prunes expired entries, then the oldest beyond the cap', async () => {
    const store = new FakeStore()
    const cache = new ResponseCache(store, () => 1000)
    for (const [key, storedAt] of [['old', 100], ['b', 800], ['c', 900], ['d', 950]] as const) {
      store.data.set(key, { value: key, storedAt })
    }
    await cache.prune(500, 2)
    expect([...store.data.keys()].sort()).toEqual(['c', 'd'])
  })
})
