import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { setLibraryRepository, LocalStorageLibraryRepository, type LibraryRepository } from '@/services/libraryRepository'
import { useLibraryStore } from './library'
import type { GameRef } from '@/types/library'

const game = (id: number): GameRef => ({ id, name: `Game ${id}`, image: null, released: null, genres: [] })

describe('library store', () => {
  beforeEach(() => {
    localStorage.clear()
    setLibraryRepository(new LocalStorageLibraryRepository(localStorage, 'test'))
    setActivePinia(createPinia())
  })

  it('adds a game and persists it', async () => {
    const store = useLibraryStore()
    await store.add(game(1), 'wishlist')
    expect(store.get(1)?.status).toBe('wishlist')

    const fresh = useLibraryStore(createPinia())
    await fresh.load()
    expect(fresh.get(1)?.name).toBe('Game 1')
  })

  it('moves an existing game instead of duplicating it', async () => {
    const store = useLibraryStore()
    await store.add(game(1), 'wishlist')
    await store.add(game(1), 'playing')
    expect(store.count).toBe(1)
    expect(store.get(1)?.status).toBe('playing')
  })

  it('sanitizes rating, hours and notes', async () => {
    const store = useLibraryStore()
    await store.add(game(1), 'playing')
    await store.update(1, { rating: 9, hoursPlayed: -4, notes: 'x'.repeat(5000) })
    expect(store.get(1)).toMatchObject({ rating: 5, hoursPlayed: 0 })
    expect(store.get(1)?.notes).toHaveLength(2000)
    await store.update(1, { hoursPlayed: 12.34, rating: null })
    expect(store.get(1)).toMatchObject({ rating: null, hoursPlayed: 12.3 })
  })

  it('computes counts and stats', async () => {
    const store = useLibraryStore()
    await store.add(game(1), 'completed')
    await store.add(game(2), 'playing')
    await store.update(1, { rating: 4, hoursPlayed: 10 })
    await store.update(2, { rating: 2, hoursPlayed: 2.5 })
    expect(store.countsByStatus).toMatchObject({ completed: 1, playing: 1, backlog: 0 })
    expect(store.stats).toMatchObject({ total: 2, hours: 12.5, averageRating: 3 })
  })

  it('removes entries', async () => {
    const store = useLibraryStore()
    await store.add(game(1), 'backlog')
    await store.remove(1)
    expect(store.get(1)).toBeUndefined()
    expect(await new LocalStorageLibraryRepository(localStorage, 'test').list()).toEqual([])
  })

  it('rolls back when persistence fails', async () => {
    const failing: LibraryRepository = {
      list: async () => [],
      save: vi.fn().mockRejectedValue(new Error('quota')),
      remove: vi.fn(),
    }
    setLibraryRepository(failing)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const store = useLibraryStore()
    await store.add(game(1), 'backlog')
    expect(store.get(1)).toBeUndefined()
    expect(store.error).toMatch(/Could not save/)
  })
})
