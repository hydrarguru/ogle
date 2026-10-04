import { describe, expect, it } from 'vitest'
import { buildSteamEntries, coreTitle, listSkipped, normalizeTitle, stripModeSuffix, pickMatch, statusFor, type SteamGame } from './steamImport'
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

describe('loose title matching', () => {
  it.each([
    ['Batman: Arkham City - Game of the Year Edition', 'Batman: Arkham City'],
    ['DOOM', 'DOOM (2016)'],
    ['The Witcher 3: Wild Hunt', 'Witcher 3: Wild Hunt'],
    ['FINAL FANTASY VII', 'Final Fantasy 7'],
    ['Wolfenstein II: The New Colossus', 'Wolfenstein 2: The New Colossus'],
    ['BioShock Remastered', 'BioShock'],
    ['Mass Effect Legendary Edition', 'Mass Effect'],
    ['Tomb Raider: Definitive Edition', 'Tomb Raider'],
  ])('treats %s as %s', (steamName, rawgName) => {
    expect(pickMatch(steam(1, steamName), [rawg(9, rawgName)])?.id).toBe(9)
  })

  it.each([
    ['Batman', 'Batman: Arkham City'],
    ['Portal', 'Portal 2'],
    ['Civilization V', 'Civilization VI'],
    ['Resident Evil', 'Resident Evil 4'],
  ])('does not treat %s as %s', (steamName, rawgName) => {
    expect(pickMatch(steam(1, steamName), [rawg(9, rawgName)])).toBeUndefined()
  })

  it('prefers an identical title over a loose one', () => {
    const candidates = [rawg(1, 'DOOM (2016)'), rawg(2, 'DOOM')]
    expect(pickMatch(steam(1, 'DOOM'), candidates)?.id).toBe(2)
  })

  it('keeps the first word, so a title that starts with a roman numeral is untouched', () => {
    expect(coreTitle('X-Men')).toBe('x men')
    expect(coreTitle('The Last of Us')).toBe('last of us')
  })
})

describe('games Steam splits into one app per mode', () => {
  const base = rawg(5, 'Call of Duty: Black Ops')

  it.each(['Call of Duty®: Black Ops - Multiplayer', 'Call of Duty: Black Ops - Zombies', 'Call of Duty: Black Ops - Single Player', 'Call of Duty: Black Ops: Campaign'])(
    'matches %s to the base game',
    (name) => {
      expect(pickMatch(steam(1, name), [base])?.id).toBe(5)
    },
  )

  it('does not mix up different games in a series', () => {
    expect(pickMatch(steam(1, 'Call of Duty: Black Ops II - Zombies'), [base])).toBeUndefined()
    expect(pickMatch(steam(1, 'Call of Duty: Black Ops III'), [base])).toBeUndefined()
  })

  it('prefers a RAWG entry that is named exactly like the mode app', () => {
    const own = rawg(6, 'Call of Duty: Black Ops - Zombies')
    expect(pickMatch(steam(1, 'Call of Duty: Black Ops - Zombies'), [base, own])?.id).toBe(6)
  })

  it('only strips a trailing label after a separator', () => {
    expect(stripModeSuffix('Zombies')).toBe('Zombies')
    expect(stripModeSuffix('Plants vs. Zombies')).toBe('Plants vs. Zombies')
    expect(stripModeSuffix('Left 4 Dead - Multiplayer')).toBe('Left 4 Dead')
    expect(stripModeSuffix('Game - Co-op ')).toBe('Game')
  })

  it('combines the apps into one entry with added-up hours and reports it', () => {
    const plan = buildSteamEntries(
      [
        { game: steam(1, 'Call of Duty: Black Ops', 600, 0), rawg: base },
        { game: steam(2, 'Call of Duty: Black Ops - Multiplayer', 1200, 0), rawg: base },
        { game: steam(3, 'Call of Duty: Black Ops - Zombies', 300, 0), rawg: base },
        { game: steam(4, 'Portal 2', 60, 0), rawg: rawg(9, 'Portal 2') },
      ],
      () => undefined,
    )
    expect(plan.added).toBe(2)
    expect(plan.entries.find((e) => e.id === 5)?.hoursPlayed).toBe(35)
    expect(plan.combined).toEqual([{ id: 5, name: 'Call of Duty: Black Ops', count: 3, hours: 35 }])
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
