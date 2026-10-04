import { createPersistentStore, ResponseCache } from './cache'
import type { GameDetails, GameSummary, Genre, Paginated, Screenshot } from '@/types/rawg'

const BASE_URL = 'https://api.rawg.io/api'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
/** Entries older than this are deleted from persistent storage. */
const MAX_AGE_MS = 7 * DAY
const MAX_STORED_ENTRIES = 300

/** How long a response is served from cache before RAWG is asked again. */
function ttlFor(path: string): number {
  if (path === '/genres') return 7 * DAY
  if (/^\/games\/[^/]+/.test(path)) return DAY // details and screenshots rarely change
  return 15 * MINUTE // lists: popularity and ordering shift more often
}

export class RawgError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'RawgError'
  }
}

let cache = new ResponseCache(createPersistentStore())
let pruned = false
/** Requests currently on the wire, so concurrent identical calls share one fetch. */
const inflight = new Map<string, Promise<unknown>>()

/** Empties both cache layers. */
export function clearRawgCache() {
  return cache.clear()
}

/** Forgets only the in-memory layer, as a page reload would. */
export function resetRawgMemoryCache() {
  cache.clearMemory()
}

/** Replaces the cache (used by tests to inject a fake store and clock). */
export function configureRawgCache(next: ResponseCache) {
  cache = next
  pruned = false
  inflight.clear()
}

type Params = Record<string, string | number | undefined>

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/** Lets one caller cancel waiting without cancelling the shared request. */
function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'))
    if (signal.aborted) return onAbort()
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}

async function fetchAndStore(url: URL, cacheKey: string): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new RawgError('Could not reach the RAWG API. Check your connection and try again.')
  }
  if (!response.ok) {
    throw new RawgError(
      response.status === 404 ? 'Game not found.' : `RAWG API request failed (${response.status}).`,
      response.status,
    )
  }
  const value = await response.json()
  await cache.put(cacheKey, value)
  return value
}

/** Failures that say nothing about the data itself, so an old copy is better than an error. */
const isTransient = (error: unknown) =>
  error instanceof RawgError && (error.status === undefined || error.status === 429 || error.status >= 500)

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

  if (!pruned) {
    pruned = true
    void cache.prune(MAX_AGE_MS, MAX_STORED_ENTRIES)
  }

  const cached = await cache.lookup(cacheKey)
  signal?.throwIfAborted()
  if (cached && cache.isFresh(cached, ttlFor(path))) return cached.value as T

  let pending = inflight.get(cacheKey)
  if (!pending) {
    pending = fetchAndStore(url, cacheKey).finally(() => inflight.delete(cacheKey))
    pending.catch(() => {}) // avoid an unhandled rejection if every waiter has aborted
    inflight.set(cacheKey, pending)
  }

  try {
    return (await abortable(pending, signal)) as T
  } catch (error) {
    if (isAbort(error)) throw error
    // Offline, rate limited (RAWG's free tier is capped) or RAWG is down: serve the stale copy.
    if (cached && isTransient(error)) return cached.value as T
    throw error
  }
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
