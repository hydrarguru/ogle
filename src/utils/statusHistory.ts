import { LIBRARY_STATUSES, type LibraryEntry, type LibraryStatus, type StatusChange } from '@/types/library'

const toIso = (value: unknown): string | null =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null

/**
 * Validates an untrusted status history. Bad items are dropped, items are put in date order and repeats of the
 * same status collapse into the first one. The result always ends with `status`: an empty history starts at
 * `addedAt`, and a history whose last status differs gets `status` appended at `updatedAt`.
 */
export function normalizeHistory(raw: unknown, status: LibraryStatus, addedAt: string, updatedAt = addedAt): StatusChange[] {
  const items: StatusChange[] = []
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== 'object' || item === null) continue
      const { status: s, at } = item as Record<string, unknown>
      const iso = toIso(at)
      if (iso && typeof s === 'string' && (LIBRARY_STATUSES as readonly string[]).includes(s)) {
        items.push({ status: s as LibraryStatus, at: iso })
      }
    }
  }
  items.sort((a, b) => a.at.localeCompare(b.at))

  const history: StatusChange[] = []
  for (const item of items.slice(0, 500)) {
    if (history.at(-1)?.status !== item.status) history.push(item)
  }
  const last = history.at(-1)
  if (!last) return [{ status, at: addedAt }]
  if (last.status !== status) history.push({ status, at: updatedAt > last.at ? updatedAt : last.at })
  return history
}

/** Appends a change to `status`, unless the game already has that status. */
export function recordStatusChange(history: StatusChange[], status: LibraryStatus, at: string): StatusChange[] {
  return history.at(-1)?.status === status ? history : [...history, { status, at }]
}

/** Earliest and latest date the change at `index` can move to while keeping the history in order. */
export function changeDateBounds(history: StatusChange[], index: number): { min?: string; max?: string } {
  return { min: history[index - 1]?.at, max: history[index + 1]?.at }
}

/** Moves the change at `index` to `at`, clamped between its neighbours so the order never changes. */
export function moveStatusChange(history: StatusChange[], index: number, at: string): StatusChange[] {
  const iso = toIso(at)
  if (!iso || !history[index]) return history
  const { min, max } = changeDateBounds(history, index)
  let clamped = iso
  if (min && clamped < min) clamped = min
  if (max && clamped > max) clamped = max
  return history.map((change, i) => (i === index ? { ...change, at: clamped } : change))
}

/**
 * Removes the change at `index`. The latest change is the current status and cannot be removed; if removing
 * leaves the same status twice in a row, the later one is merged into the earlier.
 */
export function removeStatusChange(history: StatusChange[], index: number): StatusChange[] {
  if (index < 0 || index >= history.length - 1) return history
  const rest = history.filter((_, i) => i !== index)
  return rest.filter((change, i) => rest[i - 1]?.status !== change.status)
}

export interface TimelineMark extends StatusChange {
  time: number
}

export interface TimelineSegment {
  status: LibraryStatus
  start: number
  end: number
}

export interface TimelineRow {
  entry: LibraryEntry
  marks: TimelineMark[]
  /** The span each status lasted; the current status runs until `end` of the timeline. */
  segments: TimelineSegment[]
}

export interface Timeline {
  rows: TimelineRow[]
  start: number
  end: number
}

/** Lays out the library as one row per game, earliest first, spanning from the first change to `now`. */
export function buildTimeline(entries: LibraryEntry[], now = Date.now()): Timeline {
  const rows = entries
    .map((entry) => ({ entry, marks: entry.history.map((c) => ({ ...c, time: Date.parse(c.at) })) }))
    .filter((row) => row.marks.length)
    .sort((a, b) => a.marks[0].time - b.marks[0].time || a.entry.name.localeCompare(b.entry.name))

  const start = rows.length ? Math.min(...rows.map((r) => r.marks[0].time)) : now
  const end = Math.max(now, ...rows.map((r) => r.marks.at(-1)!.time))

  return {
    start,
    end,
    rows: rows.map(({ entry, marks }) => ({
      entry,
      marks,
      segments: marks.map((m, i) => ({ status: m.status, start: m.time, end: marks[i + 1]?.time ?? end })),
    })),
  }
}

export interface TimelineTick {
  time: number
  label: string
  /** Year boundaries get a stronger line. */
  major: boolean
}

/**
 * Axis ticks between `start` and `end`: every month while the span is short enough to label them all,
 * otherwise every year. Months are labelled with their short name and January with the year.
 */
export function timelineTicks(start: number, end: number, maxMonthTicks = 36): TimelineTick[] {
  const first = new Date(start)
  const cursor = new Date(first.getFullYear(), first.getMonth() + 1, 1)
  const months = (new Date(end).getFullYear() - cursor.getFullYear()) * 12 + new Date(end).getMonth() - cursor.getMonth() + 1
  const monthly = months <= maxMonthTicks
  if (!monthly) cursor.setMonth(0, 1)
  if (!monthly && cursor.getTime() <= start) cursor.setFullYear(cursor.getFullYear() + 1)

  const ticks: TimelineTick[] = []
  while (cursor.getTime() <= end) {
    const january = cursor.getMonth() === 0
    ticks.push({
      time: cursor.getTime(),
      label: january ? String(cursor.getFullYear()) : cursor.toLocaleDateString(undefined, { month: 'short' }),
      major: january,
    })
    if (monthly) cursor.setMonth(cursor.getMonth() + 1)
    else cursor.setFullYear(cursor.getFullYear() + 1)
  }
  return ticks
}
