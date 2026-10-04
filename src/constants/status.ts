import type { LibraryStatus } from '@/types/library'

export interface StatusMeta {
  label: string
  /** Tailwind classes for the text/background pair used on badges. */
  badge: string
  /** Solid dot colour. */
  dot: string
}

export const STATUS_META: Record<LibraryStatus, StatusMeta> = {
  playing: { label: 'Playing', badge: 'bg-status-playing/15 text-status-playing', dot: 'bg-status-playing' },
  backlog: { label: 'Backlog', badge: 'bg-status-backlog/15 text-status-backlog', dot: 'bg-status-backlog' },
  wishlist: { label: 'Wishlist', badge: 'bg-status-wishlist/15 text-status-wishlist', dot: 'bg-status-wishlist' },
  completed: { label: 'Completed', badge: 'bg-status-completed/15 text-status-completed', dot: 'bg-status-completed' },
  dropped: { label: 'Dropped', badge: 'bg-status-dropped/15 text-status-dropped', dot: 'bg-status-dropped' },
}
