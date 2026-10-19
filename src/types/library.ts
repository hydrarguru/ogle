export const LIBRARY_STATUSES = ['playing', 'backlog', 'wishlist', 'completed', 'dropped'] as const
export type LibraryStatus = (typeof LIBRARY_STATUSES)[number]

/** The minimal game info we snapshot so the library can render without the API. */
export interface GameRef {
  id: number
  name: string
  image: string | null
  released: string | null
  genres: string[]
}

/** One status change: the status a game moved to and when. */
export interface StatusChange {
  status: LibraryStatus
  at: string
}

export interface LibraryEntry extends GameRef {
  status: LibraryStatus
  /** Every status the game has had, oldest first. The last item matches `status`. */
  history: StatusChange[]
  /** Personal rating, 1-5, or null when unrated. */
  rating: number | null
  hoursPlayed: number
  notes: string
  addedAt: string
  updatedAt: string
}

/** Fields the user can edit on an entry. */
export type LibraryEntryPatch = Partial<Pick<LibraryEntry, 'status' | 'rating' | 'hoursPlayed' | 'notes'>>
