import { describe, expect, it, vi } from 'vitest'
import { handleSteamLibrary } from './steamLibrary'

const call = (profile: string | null, fetchImpl: typeof fetch, apiKey: string | undefined = 'KEY', method = 'GET') => {
  const url = new URL('https://ogle.test/.netlify/functions/steam-library')
  if (profile !== null) url.searchParams.set('profile', profile)
  return handleSteamLibrary(new Request(url, { method }), { apiKey, fetch: fetchImpl })
}
const reply = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))

describe('handleSteamLibrary', () => {
  it('resolves a custom url, lists games and sends the key only to Steam', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      if (url.pathname.includes('ResolveVanityURL')) return await reply({ response: { success: 1, steamid: '76561197960287930' } })
      return await reply({
        response: {
          game_count: 3,
          games: [
            { appid: 620, name: 'Portal 2', playtime_forever: 571, playtime_2weeks: 10 },
            { appid: 70, name: 'Half-Life' },
            { appid: 'bad', name: 'Broken' },
          ],
        },
      })
    })
    const res = await call('https://steamcommunity.com/id/gabe', fetchMock as unknown as typeof fetch)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      steamId: '76561197960287930',
      games: [
        { appId: 620, name: 'Portal 2', playtimeMinutes: 571, recentMinutes: 10 },
        { appId: 70, name: 'Half-Life', playtimeMinutes: 0, recentMinutes: 0 },
      ],
    })
    const hosts = fetchMock.mock.calls.map(([u]) => new URL(String(u)).host)
    expect(new Set(hosts)).toEqual(new Set(['api.steampowered.com']))
    expect(fetchMock.mock.calls.every(([u]) => new URL(String(u)).searchParams.get('key') === 'KEY')).toBe(true)
  })

  it('skips vanity resolution for a SteamID64', async () => {
    const fetchMock = vi.fn(() => reply({ response: { game_count: 0 } }))
    const res = await call('76561197960287930', fetchMock as unknown as typeof fetch)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(await res.json()).toEqual({ steamId: '76561197960287930', games: [] })
  })

  it('reports private profiles as 403', async () => {
    const res = await call('76561197960287930', (() => reply({ response: {} })) as unknown as typeof fetch)
    expect(res.status).toBe(403)
    expect((await res.json()).error).toMatch(/private/i)
  })

  it('reports unknown custom names as 404', async () => {
    const res = await call('nobody-here', (() => reply({ response: { success: 42 } })) as unknown as typeof fetch)
    expect(res.status).toBe(404)
  })

  it('rejects bad input without calling Steam', async () => {
    const fetchMock = vi.fn()
    expect((await call('https://evil.example/id/x', fetchMock as unknown as typeof fetch)).status).toBe(400)
    expect((await call(null, fetchMock as unknown as typeof fetch)).status).toBe(400)
    expect((await call('gabe', fetchMock as unknown as typeof fetch, 'KEY', 'POST')).status).toBe(405)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails clearly without a key, and maps upstream failures to 502 without leaking the key', async () => {
    expect((await call('gabe', vi.fn() as unknown as typeof fetch, '')).status).toBe(500)
    for (const impl of [() => reply({}, 500), () => reply({}, 403), () => Promise.reject(new Error('https://x?key=KEY'))]) {
      const res = await call('76561197960287930', impl as unknown as typeof fetch)
      expect(res.status).toBe(502)
      expect(JSON.stringify(await res.json())).not.toContain('KEY')
    }
  })
})
