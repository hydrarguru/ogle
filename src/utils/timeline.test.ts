import { describe, expect, it } from 'vitest'
import { buildTimeline, monthTicks } from './timeline'
import { LIBRARY_STATUSES, type LibraryEntry, type StatusEvent } from '@/types/library'

const all = new Set(LIBRARY_STATUSES)
const t = (iso: string) => Date.parse(iso)
const now = t('2025-06-15T12:00:00.000Z')

const entry = (id: number, history: StatusEvent[]): LibraryEntry => ({
  id,
  name: `Game ${id}`,
  image: null,
  released: null,
  genres: [],
  status: history[history.length - 1].status,
  rating: null,
  hoursPlayed: 0,
  notes: '',
  addedAt: history[0].at,
  updatedAt: history[0].at,
  history,
})

describe('buildTimeline', () => {
  const finished = entry(1, [
    { status: 'backlog', at: '2025-01-10T00:00:00.000Z' },
    { status: 'playing', at: '2025-02-01T00:00:00.000Z' },
    { status: 'completed', at: '2025-03-01T00:00:00.000Z' },
  ])
  const playing = entry(2, [{ status: 'playing', at: '2025-05-01T00:00:00.000Z' }])

  it('draws bars for ongoing statuses and stops at a finish', () => {
    const { rows } = buildTimeline([finished], all, now)
    expect(rows[0].events.map((e) => e.status)).toEqual(['backlog', 'playing', 'completed'])
    expect(rows[0].segments).toEqual([
      { status: 'backlog', kind: 'waiting', start: t('2025-01-10T00:00:00.000Z'), end: t('2025-02-01T00:00:00.000Z') },
      { status: 'playing', kind: 'active', start: t('2025-02-01T00:00:00.000Z'), end: t('2025-03-01T00:00:00.000Z') },
    ])
  })

  it('runs a current status up to now and puts recent activity first', () => {
    const { rows } = buildTimeline([finished, playing], all, now)
    expect(rows.map((r) => r.entry.id)).toEqual([2, 1])
    expect(rows[0].segments).toEqual([{ status: 'playing', kind: 'active', start: t('2025-05-01T00:00:00.000Z'), end: now }])
  })

  it('spans whole months from the first event to now', () => {
    const { start, end } = buildTimeline([finished, playing], all, now)
    expect(new Date(start)).toEqual(new Date(2025, 0, 1))
    expect(new Date(end)).toEqual(new Date(2025, 6, 1))
  })

  it('hides filtered statuses and games left without events', () => {
    const { rows } = buildTimeline([finished, playing], new Set(['completed', 'dropped'] as const), now)
    expect(rows.map((r) => r.entry.id)).toEqual([1])
    expect(rows[0].events.map((e) => e.status)).toEqual(['completed'])
    expect(rows[0].segments).toEqual([])
  })

  it('clamps future dates to now', () => {
    const { rows } = buildTimeline([entry(3, [{ status: 'dropped', at: '2030-01-01T00:00:00.000Z' }])], all, now)
    expect(rows[0].events[0].at).toBe(now)
  })
})

describe('monthTicks', () => {
  it('labels months, and January with the year', () => {
    const ticks = monthTicks(new Date(2024, 10, 1).getTime(), new Date(2025, 2, 1).getTime(), 'en-US')
    expect(ticks.map((tick) => tick.label)).toEqual(['Nov', 'Dec', '2025', 'Feb'])
    expect(ticks.filter((tick) => tick.isYear)).toHaveLength(1)
  })
})
