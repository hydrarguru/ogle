import { describe, expect, it } from 'vitest'
import { appendEvent, MAX_HISTORY, normalizeHistory } from './statusHistory'

describe('normalizeHistory', () => {
  it('derives one event for entries saved before history existed', () => {
    expect(normalizeHistory(undefined, 'playing', '2024-01-01T00:00:00.000Z')).toEqual([
      { status: 'playing', at: '2024-01-01T00:00:00.000Z' },
    ])
  })

  it('drops invalid events and sorts the rest', () => {
    const raw = [
      { status: 'completed', at: '2024-03-01' },
      { status: 'bogus', at: '2024-01-01' },
      { status: 'playing', at: 'garbage' },
      'junk',
      { status: 'playing', at: '2024-02-01T10:00:00Z' },
    ]
    expect(normalizeHistory(raw, 'completed', '2024-01-01T00:00:00.000Z')).toEqual([
      { status: 'playing', at: '2024-02-01T10:00:00.000Z' },
      { status: 'completed', at: '2024-03-01T00:00:00.000Z' },
    ])
  })
})

describe('appendEvent', () => {
  it('keeps at most MAX_HISTORY events', () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => ({ status: 'playing' as const, at: String(i) }))
    const next = appendEvent(full, 'dropped', 'later')
    expect(next).toHaveLength(MAX_HISTORY)
    expect(next[next.length - 1]).toEqual({ status: 'dropped', at: 'later' })
  })
})
