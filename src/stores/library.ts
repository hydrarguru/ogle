import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getLibraryRepository } from '@/services/libraryRepository'
import {
  LIBRARY_STATUSES,
  type GameRef,
  type LibraryEntry,
  type LibraryEntryPatch,
  type LibraryStatus,
} from '@/types/library'

export const MAX_HOURS = 99999
export const MAX_NOTES_LENGTH = 2000

function sanitize(patch: LibraryEntryPatch): LibraryEntryPatch {
  const clean: LibraryEntryPatch = { ...patch }
  if ('rating' in clean && clean.rating != null) {
    clean.rating = Math.min(5, Math.max(1, Math.round(clean.rating)))
  }
  if (clean.hoursPlayed !== undefined) {
    const hours = Number.isFinite(clean.hoursPlayed) ? clean.hoursPlayed : 0
    clean.hoursPlayed = Math.min(MAX_HOURS, Math.max(0, Math.round(hours * 10) / 10))
  }
  if (clean.notes !== undefined) clean.notes = clean.notes.slice(0, MAX_NOTES_LENGTH)
  return clean
}

export const useLibraryStore = defineStore('library', () => {
  const entries = ref<Record<number, LibraryEntry>>({})
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const list = computed(() => Object.values(entries.value))
  const count = computed(() => list.value.length)

  const countsByStatus = computed(() => {
    const counts = Object.fromEntries(LIBRARY_STATUSES.map((s) => [s, 0])) as Record<LibraryStatus, number>
    for (const entry of list.value) counts[entry.status]++
    return counts
  })

  const stats = computed(() => {
    const rated = list.value.filter((e) => e.rating !== null)
    return {
      total: count.value,
      completed: countsByStatus.value.completed,
      playing: countsByStatus.value.playing,
      hours: Math.round(list.value.reduce((sum, e) => sum + e.hoursPlayed, 0) * 10) / 10,
      averageRating: rated.length ? rated.reduce((sum, e) => sum + (e.rating ?? 0), 0) / rated.length : null,
    }
  })

  function get(gameId: number): LibraryEntry | undefined {
    return entries.value[gameId]
  }

  async function load() {
    try {
      const stored = await getLibraryRepository().list()
      entries.value = Object.fromEntries(stored.map((e) => [e.id, e]))
      error.value = null
    } catch (e) {
      error.value = 'Could not load your library.'
      console.error(e)
    } finally {
      loaded.value = true
    }
  }

  /** Applies a change optimistically and rolls back if persisting fails. */
  async function commit(gameId: number, next: LibraryEntry | undefined) {
    const previous = entries.value[gameId]
    if (next) entries.value[gameId] = next
    else delete entries.value[gameId]
    try {
      if (next) await getLibraryRepository().save(next)
      else await getLibraryRepository().remove(gameId)
      error.value = null
    } catch (e) {
      if (previous) entries.value[gameId] = previous
      else delete entries.value[gameId]
      error.value = 'Could not save your changes. Is browser storage full or disabled?'
      console.error(e)
    }
  }

  /** Adds a game, or just moves it to `status` when it is already in the library. */
  async function add(game: GameRef, status: LibraryStatus) {
    const existing = entries.value[game.id]
    if (existing) return update(game.id, { status })
    const now = new Date().toISOString()
    await commit(game.id, { ...game, status, rating: null, hoursPlayed: 0, notes: '', addedAt: now, updatedAt: now })
  }

  async function update(gameId: number, patch: LibraryEntryPatch) {
    const existing = entries.value[gameId]
    if (!existing) return
    await commit(gameId, { ...existing, ...sanitize(patch), updatedAt: new Date().toISOString() })
  }

  async function remove(gameId: number) {
    if (entries.value[gameId]) await commit(gameId, undefined)
  }

  /**
   * Merges imported entries into the library. For games that already exist the
   * most recently updated version wins, so importing never loses newer local edits.
   */
  async function importEntries(incoming: LibraryEntry[]) {
    const result = { added: 0, updated: 0, kept: 0 }
    const repository = getLibraryRepository()
    try {
      for (const entry of incoming) {
        const current = entries.value[entry.id]
        if (current && current.updatedAt >= entry.updatedAt) {
          result.kept++
          continue
        }
        await repository.save(entry)
        entries.value[entry.id] = entry
        if (current) result.updated++
        else result.added++
      }
      error.value = null
    } catch (e) {
      error.value = 'Import failed part-way. Is browser storage full or disabled?'
      console.error(e)
      await load()
    }
    return result
  }

  return { entries, loaded, error, list, count, countsByStatus, stats, get, load, add, update, remove, importEntries }
})
