<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GameGrid from '@/components/GameGrid.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import SearchField from '@/components/SearchField.vue'
import StateMessage from '@/components/StateMessage.vue'
import { listGames, listGenres } from '@/api/rawg'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePageTitle } from '@/composables/usePageTitle'

const PAGE_SIZE = 24
// RAWG refuses to serve pages deep into large result sets.
const MAX_PAGES = 400

const ORDERINGS = [
  { value: '', label: 'Relevance' },
  { value: '-added', label: 'Most popular' },
  { value: '-metacritic', label: 'Metacritic score' },
  { value: '-rating', label: 'User rating' },
  { value: '-released', label: 'Newest' },
  { value: 'name', label: 'Name (A-Z)' },
]

const route = useRoute()
const router = useRouter()

const q = computed(() => String(route.query.q ?? ''))
const genre = computed(() => String(route.query.genre ?? ''))
const ordering = computed(() => String(route.query.ordering ?? ''))
const page = computed(() => Math.max(1, Math.min(MAX_PAGES, Number(route.query.page) || 1)))

usePageTitle(() => (q.value ? `Search: ${q.value}` : 'Browse games'))

function updateQuery(changes: Record<string, string | number | undefined>, resetPage = true) {
  const next: Record<string, string> = {}
  const merged = { ...route.query, ...(resetPage ? { page: undefined } : {}), ...changes }
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null && value !== '' && !(key === 'page' && String(value) === '1')) {
      next[key] = String(value)
    }
  }
  router.push({ query: next })
}

// Debounce typing in the search box; the URL is the source of truth.
const searchText = ref(q.value)
watch(q, (value) => (searchText.value = value))
let timer: ReturnType<typeof setTimeout> | undefined
watch(searchText, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (value.trim() !== q.value) updateQuery({ q: value.trim() })
  }, 350)
})

const genres = useAsyncData((signal) => listGenres(signal), () => 0)

const games = useAsyncData(
  (signal) =>
    listGames(
      { page: page.value, pageSize: PAGE_SIZE, search: q.value, genre: genre.value, ordering: ordering.value },
      signal,
    ),
  [q, genre, ordering, page],
  { keepPrevious: true },
)

const pageCount = computed(() =>
  Math.min(MAX_PAGES, Math.ceil((games.data.value?.count ?? 0) / PAGE_SIZE)),
)

function goToPage(next: number) {
  updateQuery({ page: next }, false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <h1 class="mb-6 text-3xl font-extrabold tracking-tight">{{ q ? `Results for “${q}”` : 'Browse games' }}</h1>

    <div class="mb-8 grid gap-3 sm:grid-cols-[1fr_12rem_12rem]">
      <SearchField v-model="searchText" placeholder="Search games…" />
      <select
        class="field"
        aria-label="Genre"
        :value="genre"
        @change="updateQuery({ genre: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">All genres</option>
        <option v-for="g in genres.data.value?.results" :key="g.id" :value="g.slug">{{ g.name }}</option>
      </select>
      <select
        class="field"
        aria-label="Sort by"
        :value="ordering"
        @change="updateQuery({ ordering: ($event.target as HTMLSelectElement).value })"
      >
        <option v-for="o in ORDERINGS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>

    <StateMessage
      v-if="games.error.value"
      tone="error"
      title="Couldn't load games"
      :description="games.error.value.message"
    >
      <button class="btn" @click="games.reload()">Try again</button>
    </StateMessage>

    <StateMessage
      v-else-if="!games.loading.value && !games.data.value?.results.length"
      title="No games found"
      description="Try a different search term or clear the filters."
    >
      <button class="btn" @click="router.push({ query: {} })">Clear filters</button>
    </StateMessage>

    <template v-else>
      <p v-if="games.data.value" class="mb-4 text-sm text-muted">
        {{ games.data.value.count.toLocaleString() }} games
      </p>
      <div :class="{ 'opacity-60 transition-opacity': games.loading.value && games.data.value }">
        <GameGrid :games="games.data.value?.results" :loading="games.loading.value" :skeletons="PAGE_SIZE" />
      </div>
      <div class="mt-10">
        <PaginationBar :page="page" :page-count="pageCount" @change="goToPage" />
      </div>
    </template>
  </main>
</template>
