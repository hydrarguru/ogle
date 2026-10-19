import type { LibraryEntry, LibraryStatus } from '@/types/library'

export const DAY_MS = 24 * 60 * 60 * 1000

/** Statuses that last until the next change and are drawn as a bar; the others only mark a moment. */
const ONGOING: Partial<Record<LibraryStatus, 'active' | 'waiting'>> = {
  playing: 'active',
  backlog: 'waiting',
  wishlist: 'waiting',
}

export interface TimelineEvent {
  status: LibraryStatus
  at: number
}

export interface TimelineSegment {
  status: LibraryStatus
  kind: 'active' | 'waiting'
  start: number
  end: number
}

export interface TimelineRow {
  entry: LibraryEntry
  events: TimelineEvent[]
  segments: TimelineSegment[]
}

export interface Timeline {
  /** Start of the first month with an event (local time). */
  start: number
  /** Start of the month after `now`. */
  end: number
  rows: TimelineRow[]
}

const monthStart = (t: number, offset = 0) => {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime()
}

/**
 * Lays out each game's status history on one shared time axis. Only events with a status in `visible` are
 * shown, and games without any are left out. Rows with the most recent activity come first.
 */
export function buildTimeline(
  entries: LibraryEntry[],
  visible: ReadonlySet<LibraryStatus>,
  now = Date.now(),
): Timeline {
  const rows: TimelineRow[] = []
  for (const entry of entries) {
    const all = entry.history.map((e) => ({ status: e.status, at: Math.min(Date.parse(e.at), now) }))
    const events = all.filter((e) => visible.has(e.status))
    if (!events.length) continue
    const segments: TimelineSegment[] = []
    all.forEach((event, i) => {
      const kind = ONGOING[event.status]
      if (!kind || !visible.has(event.status)) return
      const end = all[i + 1]?.at ?? now
      if (end > event.at) segments.push({ status: event.status, kind, start: event.at, end })
    })
    rows.push({ entry, events, segments })
  }
  const latest = (row: TimelineRow) => row.events[row.events.length - 1].at
  rows.sort((a, b) => latest(b) - latest(a) || a.entry.name.localeCompare(b.entry.name))

  const first = Math.min(now, ...rows.map((r) => r.events[0].at))
  return { start: monthStart(first), end: monthStart(now, 1), rows }
}

export interface TimelineTick {
  at: number
  label: string
  /** January: the label is the year. */
  isYear: boolean
}

/** One tick per month in [start, end). */
export function monthTicks(start: number, end: number, locale?: string): TimelineTick[] {
  const ticks: TimelineTick[] = []
  for (let t = monthStart(start); t < end; t = monthStart(t, 1)) {
    const d = new Date(t)
    const isYear = d.getMonth() === 0
    ticks.push({
      at: t,
      isYear,
      label: isYear ? String(d.getFullYear()) : d.toLocaleDateString(locale, { month: 'short' }),
    })
  }
  return ticks
}
