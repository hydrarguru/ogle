import type { GameRef } from '@/types/library'
import type { GameSummary } from '@/types/rawg'

export function toGameRef(game: GameSummary): GameRef {
  return {
    id: game.id,
    name: game.name,
    image: game.background_image,
    released: game.released,
    genres: game.genres.map((g) => g.name),
  }
}

/**
 * RAWG serves resized copies of its media; asking for one avoids downloading
 * multi-megabyte originals for a card thumbnail.
 */
export function resizeImage(url: string | null, width: 420 | 640 | 1280): string | null {
  if (!url) return null
  const marker = '/media/'
  const at = url.indexOf(marker)
  if (at === -1 || url.includes('/media/resize/')) return url
  return `${url.slice(0, at + marker.length)}resize/${width}/-/${url.slice(at + marker.length)}`
}

export function releaseYear(released: string | null): string {
  return released ? released.slice(0, 4) : 'TBA'
}

export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`
}
