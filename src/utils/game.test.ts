import { describe, expect, it } from 'vitest'
import { formatHours, releaseYear, resizeImage } from './game'

describe('game utils', () => {
  it('rewrites RAWG media urls to resized ones', () => {
    expect(resizeImage('https://media.rawg.io/media/games/abc.jpg', 420)).toBe(
      'https://media.rawg.io/media/resize/420/-/games/abc.jpg',
    )
    expect(resizeImage('https://media.rawg.io/media/resize/420/-/games/abc.jpg', 640)).toContain('/resize/420/')
    expect(resizeImage('https://example.com/x.jpg', 420)).toBe('https://example.com/x.jpg')
    expect(resizeImage(null, 420)).toBeNull()
  })

  it('formats years and hours', () => {
    expect(releaseYear('2015-05-19')).toBe('2015')
    expect(releaseYear(null)).toBe('TBA')
    expect(formatHours(3)).toBe('3h')
    expect(formatHours(3.5)).toBe('3.5h')
  })
})
