import { LIBRARY_STATUSES, type LibraryStatus, type StatusEvent } from '@/types/library'

export const MAX_HISTORY = 100

const isStatus = (value: unknown): value is LibraryStatus =>
  typeof value === 'string' && (LIBRARY_STATUSES as readonly string[]).includes(value)

/** Wording for an event on the timeline and in the history list. */
export const EVENT_LABELS: Record<LibraryStatus, string> = {
  playing: 'Started playing',
  backlog: 'Added to backlog',
  wishlist: 'Wishlisted',
  completed: 'Finished',
  dropped: 'Dropped',
}

export function sortHistory(history: StatusEvent[]): StatusEvent[] {
  return [...history].sort((a, b) => a.at.localeCompare(b.at))
}

/**
 * Validates an untrusted history (stored or imported). Entries saved before history existed have none,
 * so they get a single event: their current status, at the time they were added.
 */
export function normalizeHistory(raw: unknown, status: LibraryStatus, addedAt: string): StatusEvent[] {
  if (!Array.isArray(raw)) return [{ status, at: addedAt }]
  const events: StatusEvent[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const { status: s, at } = item as Record<string, unknown>
    if (!isStatus(s) || typeof at !== 'string' || Number.isNaN(Date.parse(at))) continue
    events.push({ status: s, at: new Date(at).toISOString() })
  }
  return sortHistory(events).slice(-MAX_HISTORY)
}

export function appendEvent(history: StatusEvent[], status: LibraryStatus, at: string): StatusEvent[] {
  return [...history, { status, at }].slice(-MAX_HISTORY)
}
