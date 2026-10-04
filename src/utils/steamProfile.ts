export type SteamProfileRef = { kind: 'id'; id: string } | { kind: 'vanity'; vanity: string }

const STEAM_ID = /^7656119\d{10}$/
const VANITY = /^[A-Za-z0-9_-]{2,32}$/
const HOSTS = new Set(['steamcommunity.com', 'www.steamcommunity.com'])

/**
 * Understands what people paste for "my Steam profile": a `/profiles/<steamid64>` or `/id/<custom name>` URL
 * (scheme optional), a bare SteamID64, or a bare custom name. Returns null for anything else, so the caller
 * never forwards arbitrary input upstream.
 */
export function parseSteamProfile(input: string): SteamProfileRef | null {
  const text = input.trim()
  if (!text || text.length > 300) return null
  if (STEAM_ID.test(text)) return { kind: 'id', id: text }
  if (!/[/.:]/.test(text)) return VANITY.test(text) ? { kind: 'vanity', vanity: text } : null

  let url: URL
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(url.protocol) || !HOSTS.has(url.hostname.toLowerCase())) return null

  const [section, value] = url.pathname.split('/').filter(Boolean)
  if (section === 'profiles' && value && STEAM_ID.test(value)) return { kind: 'id', id: value }
  if (section === 'id' && value && VANITY.test(value)) return { kind: 'vanity', vanity: value }
  return null
}
