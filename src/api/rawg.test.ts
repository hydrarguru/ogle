import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearRawgCache, getGame, listGames, RawgError } from './rawg'

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))

describe('rawg client', () => {
  beforeEach(() => {
    clearRawgCache()
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

  it('caches identical requests', async () => {
    const fetchMock = vi.fn(() => ok({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    await getGame(1)
    await getGame(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
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
