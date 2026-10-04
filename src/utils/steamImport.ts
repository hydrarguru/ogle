import type { GameSummary } from '@/types/rawg'
import type { LibraryEntry, LibraryStatus } from '@/types/library'

/** One owned game as returned by the `steam-library` function. */
export interface SteamGame {
  appId: number
  name: string
  playtimeMinutes: number
  /** Minutes played in the last two weeks. */
  recentMinutes: number
}

export interface SteamMatch {
  game: SteamGame
  rawg: GameSummary
}

/** Lower-cases and strips trademark symbols and punctuation so "Portal™ 2" equals "portal 2". */
export function normalizeTitle(name: string): string {
  return name
    .replace(/[™®©]/g, '') // before NFKD, which would turn ™ into "TM"
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** The RAWG result whose title equals the Steam title, or undefined. Close-but-different titles are not guessed. */
export function pickMatch(game: SteamGame, candidates: GameSummary[]): GameSummary | undefined {
  const wanted = normalizeTitle(game.name)
  if (!wanted) return undefined
  return candidates.find((c) => normalizeTitle(c.name) === wanted)
}

const roundHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10

/** Steam only knows what is being played now: recent play is "playing", the rest waits in the backlog. */
export function statusFor(game: Pick<SteamGame, 'playtimeMinutes' | 'recentMinutes'>): LibraryStatus {
  return game.recentMinutes > 0 ? 'playing' : 'backlog'
}

export interface SteamImportPlan {
  entries: LibraryEntry[]
  added: number
  /** Existing games whose hours go up. */
  updated: number
  /** Existing games that already have at least the Steam hours. */
  unchanged: number
}

/**
 * Turns matched games into entries to merge via `importEntries`.
 * New games get a status derived from play time. Games already in the library keep their status, rating and
 * notes; only their hours are raised, and never lowered (the user may track other platforms too).
 * Two Steam apps that map to the same RAWG game (editions, demos) have their playtime added together.
 */
export function buildSteamEntries(
  matches: SteamMatch[],
  existing: (id: number) => LibraryEntry | undefined,
  now = new Date().toISOString(),
): SteamImportPlan {
  const merged = new Map<number, { rawg: GameSummary; minutes: number; recent: number }>()
  for (const { game, rawg } of matches) {
    const m = merged.get(rawg.id) ?? { rawg, minutes: 0, recent: 0 }
    m.minutes += game.playtimeMinutes
    m.recent += game.recentMinutes
    merged.set(rawg.id, m)
  }

  const plan: SteamImportPlan = { entries: [], added: 0, updated: 0, unchanged: 0 }
  for (const { rawg, minutes, recent } of merged.values()) {
    const hours = roundHours(minutes)
    const current = existing(rawg.id)
    if (current) {
      if (hours > current.hoursPlayed) {
        plan.entries.push({ ...current, hoursPlayed: hours, updatedAt: now })
        plan.updated++
      } else plan.unchanged++
      continue
    }
    plan.entries.push({
      id: rawg.id,
      name: rawg.name,
      image: rawg.background_image,
      released: rawg.released,
      genres: rawg.genres.map((g) => g.name),
      status: statusFor({ playtimeMinutes: minutes, recentMinutes: recent }),
      rating: null,
      hoursPlayed: hours,
      notes: '',
      addedAt: now,
      updatedAt: now,
    })
    plan.added++
  }
  return plan
}
