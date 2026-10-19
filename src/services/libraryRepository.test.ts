import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageLibraryRepository } from './libraryRepository'
import type { LibraryEntry } from '@/types/library'

const entry = (id: number, overrides: Partial<LibraryEntry> = {}): LibraryEntry => ({
  id,
  name: `Game ${id}`,
  image: null,
  released: '2020-01-01',
  genres: ['Action'],
  status: 'backlog',
  history: [{ status: overrides.status ?? 'backlog', at: '2024-01-01T00:00:00.000Z' }],
  rating: null,
  hoursPlayed: 0,
  notes: '',
  addedAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

describe('LocalStorageLibraryRepository', () => {
  let repo: LocalStorageLibraryRepository

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageLibraryRepository(localStorage, 'test')
  })

  it('starts empty', async () => {
    expect(await repo.list()).toEqual([])
  })

  it('saves, overwrites and removes entries', async () => {
    await repo.save(entry(1))
    await repo.save(entry(2))
    await repo.save(entry(1, { status: 'completed' }))
    expect((await repo.list()).map((e) => [e.id, e.status])).toEqual([
      [1, 'completed'],
      [2, 'backlog'],
    ])
    await repo.remove(1)
    expect((await repo.list()).map((e) => e.id)).toEqual([2])
  })

  it('survives corrupt JSON', async () => {
    localStorage.setItem('test', '{nope')
    expect(await repo.list()).toEqual([])
  })

  it('ignores unknown schema versions and malformed entries', async () => {
    localStorage.setItem('test', JSON.stringify({ version: 99, entries: { 1: entry(1) } }))
    expect(await repo.list()).toEqual([])
    localStorage.setItem(
      'test',
      JSON.stringify({ version: 1, entries: { 1: entry(1), 2: { id: 2, status: 'bogus' } } }),
    )
    expect((await repo.list()).map((e) => e.id)).toEqual([1])
  })

  it('gives entries saved before status history existed a history starting when they were added', async () => {
    const { history: _history, ...legacy } = entry(1, { status: 'completed', addedAt: '2023-05-01T00:00:00.000Z' })
    void _history
    localStorage.setItem('test', JSON.stringify({ version: 1, entries: { 1: legacy } }))
    expect((await repo.list())[0].history).toEqual([{ status: 'completed', at: '2023-05-01T00:00:00.000Z' }])
  })
})
