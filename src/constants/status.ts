import type { LibraryStatus } from '@/types/library'

export interface StatusMeta {
  label: string
  /** Tailwind classes for the text/background pair used on badges. */
  badge: string
  /** Text colour on its own, for labels outside a badge. */
  text: string
  /** Solid dot colour. */
  dot: string
  /** What moving a game to this status means, for timeline marks ("Started", "Finished", ...). */
  event: string
}

export const STATUS_META: Record<LibraryStatus, StatusMeta> = {
  playing: {
    label: 'Playing',
    badge: 'bg-status-playing/15 text-status-playing',
    text: 'text-status-playing',
    dot: 'bg-status-playing',
    event: 'Started',
  },
  backlog: {
    label: 'Backlog',
    badge: 'bg-status-backlog/15 text-status-backlog',
    text: 'text-status-backlog',
    dot: 'bg-status-backlog',
    event: 'Added to backlog',
  },
  wishlist: {
    label: 'Wishlist',
    badge: 'bg-status-wishlist/15 text-status-wishlist',
    text: 'text-status-wishlist',
    dot: 'bg-status-wishlist',
    event: 'Wishlisted',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-status-completed/15 text-status-completed',
    text: 'text-status-completed',
    dot: 'bg-status-completed',
    event: 'Finished',
  },
  dropped: {
    label: 'Dropped',
    badge: 'bg-status-dropped/15 text-status-dropped',
    text: 'text-status-dropped',
    dot: 'bg-status-dropped',
    event: 'Dropped',
  },
}
