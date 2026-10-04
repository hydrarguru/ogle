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

export interface LibraryEntry extends GameRef {
  status: LibraryStatus
  /** Personal rating, 1-5, or null when unrated. */
  rating: number | null
  hoursPlayed: number
  notes: string
  addedAt: string
  updatedAt: string
}

/** Fields the user can edit on an entry. */
export type LibraryEntryPatch = Partial<Pick<LibraryEntry, 'status' | 'rating' | 'hoursPlayed' | 'notes'>>
