import { describe, expect, it } from 'vitest'
import { exportFilename, ImportError, parseLibraryExport, serializeLibrary } from './libraryTransfer'
import type { LibraryEntry } from '@/types/library'

const entry: LibraryEntry = {
  id: 1, name: 'Portal 2', image: 'https://x.test/a.jpg', released: '2011-04-18', genres: ['Puzzle'],
  status: 'completed', rating: 5, hoursPlayed: 9.5, notes: 'GLaDOS', addedAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-02-01T00:00:00.000Z',
}

describe('library export/import', () => {
  it('round-trips entries', () => {
    const text = serializeLibrary([entry], new Date('2025-03-04T10:00:00Z'))
    expect(JSON.parse(text)).toMatchObject({ format: 'ogle-library', version: 1, exportedAt: '2025-03-04T10:00:00.000Z' })
    expect(parseLibraryExport(text)).toEqual({ entries: [entry], skipped: 0 })
    expect(exportFilename(new Date('2025-03-04T10:00:00Z'))).toBe('ogle-library-2025-03-04.json')
  })

  it('rejects non-JSON and foreign files', () => {
    expect(() => parseLibraryExport('{nope')).toThrow(ImportError)
    expect(() => parseLibraryExport('{"entries":[]}')).toThrow(/not an OGLe/)
    expect(() => parseLibraryExport('[]')).toThrow(/not an OGLe/)
    expect(() => parseLibraryExport('null')).toThrow(/not an OGLe/)
    expect(() => parseLibraryExport(JSON.stringify({ format: 'ogle-library', version: 2, entries: [] }))).toThrow(/newer/)
  })

  it('skips invalid records and sanitizes hostile values', () => {
    const file = JSON.stringify({
      format: 'ogle-library', version: 1,
      entries: [
        entry,
        { ...entry, id: 2, status: 'bogus' },
        { ...entry, id: -3 },
        'junk',
        { ...entry, id: 4, rating: 99, hoursPlayed: -5, notes: 'x'.repeat(9000), image: 'javascript:alert(1)', updatedAt: 'garbage' },
      ],
    })
    const { entries, skipped } = parseLibraryExport(file, '2025-01-01T00:00:00.000Z')
    expect(skipped).toBe(3)
    const sanitized = entries.find((e) => e.id === 4)!
    expect(sanitized).toMatchObject({ rating: 5, hoursPlayed: 0, image: null, updatedAt: entry.addedAt })
    expect(sanitized.notes).toHaveLength(2000)
  })

  it('keeps the last duplicate id', () => {
    const file = JSON.stringify({ format: 'ogle-library', version: 1, entries: [entry, { ...entry, notes: 'later' }] })
    expect(parseLibraryExport(file).entries).toMatchObject([{ notes: 'later' }])
  })
})
