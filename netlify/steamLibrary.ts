import { parseSteamProfile } from '../src/utils/steamProfile'

const API = 'https://api.steampowered.com'

export interface SteamLibraryDeps {
  apiKey: string | undefined
  fetch: typeof fetch
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': status === 200 ? 'private, max-age=60' : 'no-store' },
  })

const fail = (status: number, error: string) => json({ error }, status)

class UpstreamError extends Error {}

async function steamGet(deps: SteamLibraryDeps, path: string, params: Record<string, string>) {
  const url = new URL(`${API}${path}`)
  for (const [k, v] of Object.entries({ ...params, key: deps.apiKey ?? '' })) url.searchParams.set(k, v)
  let response: Response
  try {
    response = await deps.fetch(url, { signal: AbortSignal.timeout(15_000) })
  } catch {
    throw new UpstreamError('Could not reach Steam.')
  }
  if (response.status === 401 || response.status === 403) throw new UpstreamError('Steam rejected the API key.')
  if (!response.ok) throw new UpstreamError(`Steam request failed (${response.status}).`)
  try {
    return (await response.json()) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch {
    throw new UpstreamError('Steam returned an unreadable response.')
  }
}

/**
 * GET ?profile=<steamcommunity URL | SteamID64 | custom name>
 * Browsers cannot call the Steam Web API directly (it sends no CORS headers and needs a secret key), so this
 * resolves the profile and lists its owned games on the server. Only validated ids/names ever reach Steam.
 */
export async function handleSteamLibrary(request: Request, deps: SteamLibraryDeps): Promise<Response> {
  if (request.method !== 'GET') return fail(405, 'Method not allowed.')
  if (!deps.apiKey) return fail(500, 'Steam import is not configured on this server (missing STEAM_API_KEY).')

  const profile = parseSteamProfile(new URL(request.url).searchParams.get('profile') ?? '')
  if (!profile) {
    return fail(400, 'That does not look like a Steam profile link. Use e.g. https://steamcommunity.com/id/yourname')
  }

  try {
    let steamId: string
    if (profile.kind === 'id') steamId = profile.id
    else {
      const resolved = (await steamGet(deps, '/ISteamUser/ResolveVanityURL/v1/', { vanityurl: profile.vanity })).response
      if (resolved?.success !== 1 || typeof resolved.steamid !== 'string') return fail(404, 'No Steam profile with that name exists.')
      steamId = resolved.steamid
    }

    const owned = (
      await steamGet(deps, '/IPlayerService/GetOwnedGames/v1/', {
        steamid: steamId,
        include_appinfo: '1',
        include_played_free_games: '1',
        format: 'json',
      })
    ).response
    // A private "Game details" setting yields an empty object; a public empty library has game_count: 0.
    if (!owned || typeof owned.game_count !== 'number') {
      return fail(403, 'This profile’s game details are private. In Steam, set Profile → Privacy Settings → Game details to Public, then try again.')
    }

    const games = (Array.isArray(owned.games) ? owned.games : []).flatMap((g: Record<string, unknown>) =>
      Number.isInteger(g.appid) && typeof g.name === 'string' && g.name
        ? [
            {
              appId: g.appid as number,
              name: g.name.slice(0, 300),
              playtimeMinutes: Math.max(0, Number(g.playtime_forever) || 0),
              recentMinutes: Math.max(0, Number(g.playtime_2weeks) || 0),
            },
          ]
        : [],
    )
    return json({ steamId, games })
  } catch (e) {
    if (e instanceof UpstreamError) return fail(502, e.message)
    throw e
  }
}
