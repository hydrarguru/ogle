export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Named {
  id: number
  name: string
  slug: string
}

export interface Genre extends Named {
  image_background?: string
}

export interface GameSummary {
  id: number
  slug: string
  name: string
  released: string | null
  background_image: string | null
  rating: number
  ratings_count: number
  metacritic: number | null
  genres: Genre[]
  parent_platforms?: { platform: Named }[]
}

export interface GameDetails extends GameSummary {
  description_raw: string
  website: string
  developers: Named[]
  publishers: Named[]
  tags: Named[]
  esrb_rating: Named | null
  playtime: number
}

export interface Screenshot {
  id: number
  image: string
  width: number
  height: number
}
