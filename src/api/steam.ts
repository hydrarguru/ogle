import { listGames } from './rawg'
import { pickMatch, type SteamGame, type SteamMatch } from '@/utils/steamImport'

const ENDPOINT = '/.netlify/functions/steam-library'
const RAWG_STEAM_STORE = '1'
const CONCURRENCY = 4

export class SteamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'SteamError'
  }
}

/** Asks the server function for the games on a Steam profile (URL, SteamID64 or custom name). */
export async function fetchSteamLibrary(profile: string, signal?: AbortSignal): Promise<SteamGame[]> {
  let response: Response
  try {
    response = await fetch(`${ENDPOINT}?${new URLSearchParams({ profile })}`, { signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new SteamError('Could not reach the server. Check your connection and try again.')
  }
  const body = (await response.json().catch(() => null)) as { games?: SteamGame[]; error?: string } | null
  if (!response.ok || !Array.isArray(body?.games)) {
    // Without the function (e.g. plain `vite dev`) the SPA fallback answers with HTML, which is not JSON.
    const message =
      body?.error ??
      (response.status === 404 || !body
        ? 'Steam import is not available here. It needs the Netlify function (run `netlify dev` locally).'
        : `Steam import failed (${response.status}).`)
    throw new SteamError(message, response.status)
  }
  return body.games
}

export interface MatchProgress {
  done: number
  total: number
}

export interface MatchResult {
  matches: SteamMatch[]
  /** Steam games with no equally named RAWG game. */
  unmatched: SteamGame[]
  /** Games RAWG could not be asked about (network, rate limit). */
  failed: SteamGame[]
}

/** Finds the RAWG game for each Steam game by exact (normalised) title among RAWG's Steam-listed games. */
export async function matchSteamGames(
  games: SteamGame[],
  onProgress?: (progress: MatchProgress) => void,
  signal?: AbortSignal,
): Promise<MatchResult> {
  const result: MatchResult = { matches: [], unmatched: [], failed: [] }
  let next = 0
  let done = 0

  async function worker() {
    while (next < games.length) {
      signal?.throwIfAborted()
      const game = games[next++]
      try {
        const page = await listGames({ search: game.name, pageSize: 5, stores: RAWG_STEAM_STORE }, signal)
        const rawg = pickMatch(game, page.results)
        if (rawg) result.matches.push({ game, rawg })
        else result.unmatched.push(game)
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e
        result.failed.push(game)
      }
      onProgress?.({ done: ++done, total: games.length })
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, games.length) }, worker))
  return result
}
