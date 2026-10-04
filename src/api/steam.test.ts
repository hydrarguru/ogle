import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./rawg', () => ({ listGames: vi.fn() }))
import { listGames } from './rawg'
import { fetchSteamLibrary, matchSteamGames, SteamError } from './steam'

const game = (appId: number, name: string) => ({ appId, name, playtimeMinutes: 60, recentMinutes: 0 })
const page = (...names: string[]) => ({
  count: names.length,
  next: null,
  previous: null,
  results: names.map((name, i) => ({ id: i + 1, name })),
})

afterEach(() => vi.restoreAllMocks())

describe('matchSteamGames', () => {
  it('splits games into matched, unmatched and failed, searching Steam-listed games only', async () => {
    vi.mocked(listGames).mockImplementation((async ({ search }: { search?: string }) => {
      if (search === 'Portal 2') return page('Portal 2')
      if (search === 'Obscure') return page('Something else')
      throw new Error('boom')
    }) as unknown as typeof listGames)
    const progress = vi.fn()
    const result = await matchSteamGames([game(1, 'Portal 2'), game(2, 'Obscure'), game(3, 'Down')], progress)
    expect(result.matches.map((m) => m.game.appId)).toEqual([1])
    expect(result.unmatched.map((g) => g.appId)).toEqual([2])
    expect(result.failed.map((g) => g.appId)).toEqual([3])
    expect(progress).toHaveBeenLastCalledWith({ done: 3, total: 3 })
    expect(vi.mocked(listGames).mock.calls[0][0]).toMatchObject({ stores: '1' })
  })

  it('stops when aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(matchSteamGames([game(1, 'a')], undefined, controller.signal)).rejects.toThrow()
  })
})

describe('fetchSteamLibrary', () => {
  const respond = (body: BodyInit | null, status = 200) => vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status })))

  it('returns the games', async () => {
    respond(JSON.stringify({ games: [game(1, 'a')] }))
    expect(await fetchSteamLibrary('gabe')).toHaveLength(1)
  })

  it('surfaces the server message', async () => {
    respond(JSON.stringify({ error: 'private' }), 403)
    await expect(fetchSteamLibrary('gabe')).rejects.toThrow('private')
  })

  it('explains a missing function (HTML fallback)', async () => {
    respond('<html></html>')
    await expect(fetchSteamLibrary('gabe')).rejects.toThrow(/netlify dev/)
  })

  it('reports network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(fetchSteamLibrary('gabe')).rejects.toBeInstanceOf(SteamError)
  })
})
