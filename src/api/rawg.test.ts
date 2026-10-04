import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ResponseCache } from './cache'
import { FakeStore } from './fakeStore'
import { clearRawgCache, configureRawgCache, getGame, listGames, listGenres, RawgError, resetRawgMemoryCache } from './rawg'

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('rawg client', () => {
  let now: number
  let store: FakeStore

  beforeEach(() => {
    now = 1_000_000
    store = new FakeStore()
    configureRawgCache(new ResponseCache(store, () => now))
    vi.stubEnv('VITE_API_KEY', 'secret')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('builds the query and omits empty params', async () => {
    const fetchMock = vi.fn(() => ok({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await listGames({ page: 2, search: 'zelda', genre: '' })
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]))
    expect(url.pathname).toBe('/api/games')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ page: '2', page_size: '24', search: 'zelda', key: 'secret' })
    expect(url.searchParams.has('genres')).toBe(false)
  })

  it('serves repeat requests from memory', async () => {
    const fetchMock = vi.fn(() => ok({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    await getGame(1)
    await getGame(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('survives a page reload via the persistent store', async () => {
    const fetchMock = vi.fn(() => ok({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    await getGame(1)
    resetRawgMemoryCache()
    expect(await getGame(1)).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('never stores the API key', async () => {
    vi.stubGlobal('fetch', () => ok({ id: 1 }))
    await getGame(1)
    expect([...store.data.keys()].join()).not.toContain('secret')
    expect(JSON.stringify([...store.data.values()])).not.toContain('secret')
  })

  it('expires entries per endpoint', async () => {
    const fetchMock = vi.fn(() => ok({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await listGames()
    await getGame(1)
    await listGenres()
    expect(fetchMock).toHaveBeenCalledTimes(3)

    now += 16 * MINUTE // lists expire after 15 min, details and genres do not
    await listGames()
    await getGame(1)
    await listGenres()
    expect(fetchMock).toHaveBeenCalledTimes(4)

    now += DAY // details expire after a day, genres after a week
    await getGame(1)
    await listGenres()
    expect(fetchMock).toHaveBeenCalledTimes(5)
    now += 7 * DAY
    await listGenres()
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('shares one request between concurrent identical calls', async () => {
    const fetchMock = vi.fn(() => ok({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    await Promise.all([getGame(1), getGame(1), getGame(1)])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('lets one caller abort without breaking the others', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const fetchMock = vi.fn(async () => {
      await gate
      return new Response(JSON.stringify({ id: 1 }))
    })
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    const aborted = getGame(1, controller.signal)
    const other = getGame(1)
    await new Promise((r) => setTimeout(r, 0))
    controller.abort()
    await expect(aborted).rejects.toMatchObject({ name: 'AbortError' })
    release()
    expect(await other).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to a stale copy on network errors, rate limits and server errors', async () => {
    vi.stubGlobal('fetch', () => ok({ id: 1 }))
    await getGame(1)
    now += 2 * DAY

    for (const failure of [
      () => Promise.reject(new TypeError('offline')),
      () => Promise.resolve(new Response('', { status: 429 })),
      () => Promise.resolve(new Response('', { status: 503 })),
    ]) {
      vi.stubGlobal('fetch', failure)
      expect(await getGame(1)).toEqual({ id: 1 })
    }
  })

  it('does not hide a 404 behind a stale copy', async () => {
    vi.stubGlobal('fetch', () => ok({ id: 1 }))
    await getGame(1)
    now += 2 * DAY
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 404 })))
    await expect(getGame(1)).rejects.toMatchObject({ status: 404 })
  })

  it('does not cache failures', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 500 })))
    await expect(getGame(1)).rejects.toBeInstanceOf(RawgError)
    expect(store.data.size).toBe(0)
    const fetchMock = vi.fn(() => ok({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await getGame(1)).toEqual({ id: 1 })
  })

  it('clearRawgCache empties both layers', async () => {
    const fetchMock = vi.fn(() => ok({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    await getGame(1)
    await clearRawgCache()
    expect(store.data.size).toBe(0)
    await getGame(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws a clear error without an API key', async () => {
    vi.stubEnv('VITE_API_KEY', '')
    await expect(getGame(1)).rejects.toThrow(/VITE_API_KEY/)
  })

  it('maps HTTP failures to RawgError', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 404 })))
    await expect(getGame(1)).rejects.toMatchObject({ status: 404, message: 'Game not found.' })
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')))
    await expect(getGame(2)).rejects.toBeInstanceOf(RawgError)
  })
})
