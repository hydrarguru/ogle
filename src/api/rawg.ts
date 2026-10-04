import type { GameDetails, GameSummary, Genre, Paginated, Screenshot } from '@/types/rawg'

const BASE_URL = 'https://api.rawg.io/api'
const CACHE_TTL_MS = 5 * 60 * 1000

export class RawgError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'RawgError'
  }
}

const cache = new Map<string, { at: number; value: unknown }>()

export function clearRawgCache() {
  cache.clear()
}

type Params = Record<string, string | number | undefined>

async function request<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const key = import.meta.env.VITE_API_KEY
  if (!key) {
    throw new RawgError('No RAWG API key configured. Set VITE_API_KEY in your .env file.')
  }

  const url = new URL(`${BASE_URL}${path}`)
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(name, String(value))
  }
  const cacheKey = url.toString() // computed before the key is added so it never lands in the cache
  url.searchParams.set('key', key)

  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as T

  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new RawgError('Could not reach the RAWG API. Check your connection and try again.')
  }
  if (!response.ok) {
    throw new RawgError(
      response.status === 404 ? 'Game not found.' : `RAWG API request failed (${response.status}).`,
      response.status,
    )
  }

  const value = (await response.json()) as T
  cache.set(cacheKey, { at: Date.now(), value })
  return value
}

export interface ListGamesOptions {
  page?: number
  pageSize?: number
  search?: string
  /** RAWG genre slug. */
  genre?: string
  /** e.g. `-added`, `-metacritic`, `-released`, `name`. */
  ordering?: string
}

export function listGames(options: ListGamesOptions = {}, signal?: AbortSignal) {
  const { page = 1, pageSize = 24, search, genre, ordering } = options
  return request<Paginated<GameSummary>>(
    '/games',
    { page, page_size: pageSize, search, genres: genre, ordering, search_precise: search ? 'true' : undefined },
    signal,
  )
}

export function getGame(id: number | string, signal?: AbortSignal) {
  return request<GameDetails>(`/games/${id}`, {}, signal)
}

export function getScreenshots(id: number | string, signal?: AbortSignal) {
  return request<Paginated<Screenshot>>(`/games/${id}/screenshots`, {}, signal)
}

export function listGenres(signal?: AbortSignal) {
  return request<Paginated<Genre>>('/genres', { ordering: 'name' }, signal)
}
