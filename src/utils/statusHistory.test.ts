import { describe, expect, it } from 'vitest'
import type { LibraryEntry, StatusChange } from '@/types/library'
import {
  buildTimeline,
  moveStatusChange,
  normalizeHistory,
  recordStatusChange,
  removeStatusChange,
  timelineTicks,
} from './statusHistory'

const JAN = '2024-01-01T00:00:00.000Z'
const FEB = '2024-02-01T00:00:00.000Z'
const MAR = '2024-03-01T00:00:00.000Z'

const entry = (id: number, history: StatusChange[]): LibraryEntry => ({
  id,
  name: `Game ${id}`,
  image: null,
  released: null,
  genres: [],
  status: history.at(-1)!.status,
  history,
  rating: null,
  hoursPlayed: 0,
  notes: '',
  addedAt: history[0].at,
  updatedAt: history.at(-1)!.at,
})

describe('normalizeHistory', () => {
  it('starts a missing history at addedAt', () => {
    expect(normalizeHistory(undefined, 'backlog', JAN)).toEqual([{ status: 'backlog', at: JAN }])
    expect(normalizeHistory([], 'backlog', JAN)).toEqual([{ status: 'backlog', at: JAN }])
  })

  it('drops bad items, sorts by date and collapses repeated statuses', () => {
    const raw = [
      { status: 'completed', at: MAR },
      { status: 'playing', at: JAN },
      { status: 'playing', at: FEB },
      { status: 'nope', at: FEB },
      { status: 'dropped', at: 'yesterday' },
      'junk',
      null,
    ]
    expect(normalizeHistory(raw, 'completed', JAN)).toEqual([
      { status: 'playing', at: JAN },
      { status: 'completed', at: MAR },
    ])
  })

  it('appends the current status when the history ends on another one', () => {
    expect(normalizeHistory([{ status: 'playing', at: JAN }], 'dropped', JAN, MAR)).toEqual([
      { status: 'playing', at: JAN },
      { status: 'dropped', at: MAR },
    ])
    // Never before the last recorded change.
    expect(normalizeHistory([{ status: 'playing', at: MAR }], 'dropped', JAN, FEB).at(-1)).toEqual({
      status: 'dropped',
      at: MAR,
    })
  })
})

describe('editing history', () => {
  const history: StatusChange[] = [
    { status: 'wishlist', at: JAN },
    { status: 'playing', at: FEB },
    { status: 'completed', at: MAR },
  ]

  it('records only real status changes', () => {
    expect(recordStatusChange(history, 'completed', '2024-04-01T00:00:00.000Z')).toBe(history)
    expect(recordStatusChange(history, 'dropped', '2024-04-01T00:00:00.000Z').at(-1)).toEqual({
      status: 'dropped',
      at: '2024-04-01T00:00:00.000Z',
    })
  })

  it('moves a change, clamped between its neighbours', () => {
    expect(moveStatusChange(history, 1, '2024-02-10T12:00:00.000Z')[1].at).toBe('2024-02-10T12:00:00.000Z')
    expect(moveStatusChange(history, 1, '2023-06-01T00:00:00.000Z')[1].at).toBe(JAN)
    expect(moveStatusChange(history, 1, '2025-06-01T00:00:00.000Z')[1].at).toBe(MAR)
    expect(moveStatusChange(history, 1, 'not a date')).toBe(history)
  })

  it('removes past changes but never the current status', () => {
    expect(removeStatusChange(history, 0).map((c) => c.status)).toEqual(['playing', 'completed'])
    expect(removeStatusChange(history, 2)).toBe(history)
  })

  it('merges neighbours left with the same status after a removal', () => {
    const backAndForth: StatusChange[] = [
      { status: 'playing', at: JAN },
      { status: 'backlog', at: FEB },
      { status: 'playing', at: MAR },
      { status: 'completed', at: '2024-04-01T00:00:00.000Z' },
    ]
    expect(removeStatusChange(backAndForth, 1)).toEqual([
      { status: 'playing', at: JAN },
      { status: 'completed', at: '2024-04-01T00:00:00.000Z' },
    ])
  })
})

describe('buildTimeline', () => {
  const now = Date.parse('2024-06-01T00:00:00.000Z')

  it('lays out one row per game, earliest first, with spans until now', () => {
    const late = entry(1, [{ status: 'playing', at: FEB }])
    const early = entry(2, [
      { status: 'playing', at: JAN },
      { status: 'completed', at: MAR },
    ])
    const timeline = buildTimeline([late, early], now)

    expect(timeline.start).toBe(Date.parse(JAN))
    expect(timeline.end).toBe(now)
    expect(timeline.rows.map((r) => r.entry.id)).toEqual([2, 1])
    expect(timeline.rows[0].segments).toEqual([
      { status: 'playing', start: Date.parse(JAN), end: Date.parse(MAR) },
      { status: 'completed', start: Date.parse(MAR), end: now },
    ])
  })

  it('stretches to changes dated after now', () => {
    const future = '2030-01-01T00:00:00.000Z'
    expect(buildTimeline([entry(1, [{ status: 'playing', at: future }])], now).end).toBe(Date.parse(future))
  })

  it('handles an empty library', () => {
    expect(buildTimeline([], now)).toEqual({ rows: [], start: now, end: now })
  })
})

describe('timelineTicks', () => {
  const local = (y: number, m: number, d = 1) => new Date(y, m, d).getTime()

  it('ticks every month for short spans, labelling January with the year', () => {
    const ticks = timelineTicks(local(2023, 10, 15), local(2024, 2, 15))
    expect(ticks.map((t) => t.time)).toEqual([local(2023, 11), local(2024, 0), local(2024, 1), local(2024, 2)])
    expect(ticks[1]).toMatchObject({ label: '2024', major: true })
    expect(ticks[0].major).toBe(false)
  })

  it('ticks every year for long spans', () => {
    const ticks = timelineTicks(local(2015, 5), local(2024, 5), 36)
    expect(ticks.map((t) => t.label)).toEqual(['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'])
    expect(ticks.every((t) => t.major)).toBe(true)
  })
})
