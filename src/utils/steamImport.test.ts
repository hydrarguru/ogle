import { describe, expect, it } from 'vitest'
import { buildSteamEntries, listSkipped, normalizeTitle, pickMatch, statusFor, type SteamGame } from './steamImport'
import type { GameSummary } from '@/types/rawg'
import type { LibraryEntry } from '@/types/library'

const steam = (appId: number, name: string, playtimeMinutes = 0, recentMinutes = 0): SteamGame => ({
  appId,
  name,
  playtimeMinutes,
  recentMinutes,
})
const rawg = (id: number, name: string): GameSummary => ({
  id,
  slug: name,
  name,
  released: '2011-04-18',
  background_image: 'https://img/x.jpg',
  rating: 4,
  ratings_count: 1,
  metacritic: null,
  genres: [{ id: 1, name: 'Puzzle', slug: 'puzzle' }],
})
const entry = (id: number, patch: Partial<LibraryEntry> = {}): LibraryEntry => ({
  id,
  name: `G${id}`,
  image: null,
  released: null,
  genres: [],
  status: 'completed',
  rating: 5,
  hoursPlayed: 10,
  notes: 'mine',
  addedAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...patch,
})

describe('title matching', () => {
  it('normalises trademarks, case and punctuation', () => {
    expect(normalizeTitle('PORTAL™ 2')).toBe('portal 2')
    expect(normalizeTitle('Tom Clancy’s  Rainbow Six® Siege')).toBe('tom clancy s rainbow six siege')
    expect(normalizeTitle('Dungeons & Dragons')).toBe(normalizeTitle('Dungeons and Dragons'))
    expect(normalizeTitle('Pokémon')).toBe('pokemon')
  })

  it('only accepts an equally named result', () => {
    const candidates = [rawg(1, 'Portal 2: Sixtyfive Roses'), rawg(2, 'Portal® 2')]
    expect(pickMatch(steam(620, 'Portal 2'), candidates)?.id).toBe(2)
    expect(pickMatch(steam(620, 'Portal 2'), [candidates[0]])).toBeUndefined()
    expect(pickMatch(steam(1, '™'), candidates)).toBeUndefined()
  })
})

describe('buildSteamEntries', () => {
  const now = '2025-05-05T00:00:00.000Z'
  const none = () => undefined

  it('derives status from recent play and hours from minutes', () => {
    expect(statusFor(steam(1, 'a', 600, 30))).toBe('playing')
    expect(statusFor(steam(1, 'a', 600, 0))).toBe('backlog')
    const plan = buildSteamEntries([{ game: steam(620, 'Portal 2', 571, 0), rawg: rawg(4200, 'Portal 2') }], none, now)
    expect(plan).toMatchObject({ added: 1, updated: 0, unchanged: 0 })
    expect(plan.entries[0]).toMatchObject({
      id: 4200,
      status: 'backlog',
      hoursPlayed: 9.5,
      genres: ['Puzzle'],
      rating: null,
      addedAt: now,
      updatedAt: now,
    })
  })

  it('raises hours on existing games without touching status, rating or notes', () => {
    const plan = buildSteamEntries([{ game: steam(1, 'a', 1200), rawg: rawg(7, 'a') }], (id) => (id === 7 ? entry(7) : undefined), now)
    expect(plan).toMatchObject({ added: 0, updated: 1 })
    expect(plan.entries[0]).toMatchObject({ status: 'completed', rating: 5, notes: 'mine', hoursPlayed: 20, updatedAt: now })
  })

  it('never lowers hours', () => {
    const plan = buildSteamEntries([{ game: steam(1, 'a', 60), rawg: rawg(7, 'a') }], () => entry(7), now)
    expect(plan).toMatchObject({ entries: [], updated: 0, unchanged: 1 })
  })

  it('adds up playtime of several Steam apps for one RAWG game', () => {
    const plan = buildSteamEntries(
      [
        { game: steam(1, 'a', 60, 0), rawg: rawg(7, 'a') },
        { game: steam(2, 'a demo', 30, 5), rawg: rawg(7, 'a') },
      ],
      none,
      now,
    )
    expect(plan.entries).toHaveLength(1)
    expect(plan.entries[0]).toMatchObject({ hoursPlayed: 1.5, status: 'playing' })
  })
})

describe('listSkipped', () => {
  it('lists most played first, then by name, with hours', () => {
    expect(listSkipped([steam(1, 'Zed', 0), steam(2, 'Alpha', 0), steam(3, 'Big', 1200), steam(4, 'Small', 33)])).toEqual([
      { appId: 3, name: 'Big', hours: 20 },
      { appId: 4, name: 'Small', hours: 0.6 },
      { appId: 2, name: 'Alpha', hours: 0 },
      { appId: 1, name: 'Zed', hours: 0 },
    ])
  })
})
