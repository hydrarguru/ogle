<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import GameCard from '@/components/GameCard.vue'
import LibraryTransfer from '@/components/LibraryTransfer.vue'
import SearchField from '@/components/SearchField.vue'
import StarRating from '@/components/StarRating.vue'
import StateMessage from '@/components/StateMessage.vue'
import { STATUS_META } from '@/constants/status'
import { usePageTitle } from '@/composables/usePageTitle'
import { useLibraryStore } from '@/stores/library'
import { LIBRARY_STATUSES, type LibraryEntry, type LibraryStatus } from '@/types/library'
import { formatHours } from '@/utils/game'
import { ref } from 'vue'

usePageTitle('My library')

const SORTS: Record<string, { label: string; compare: (a: LibraryEntry, b: LibraryEntry) => number }> = {
  updated: { label: 'Recently updated', compare: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
  added: { label: 'Recently added', compare: (a, b) => b.addedAt.localeCompare(a.addedAt) },
  name: { label: 'Name (A-Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  rating: { label: 'My rating', compare: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) },
  hours: { label: 'Hours played', compare: (a, b) => b.hoursPlayed - a.hoursPlayed },
}

const library = useLibraryStore()
const route = useRoute()
const router = useRouter()
const filter = ref('')

const status = computed(() => {
  const value = String(route.query.status ?? '')
  return (LIBRARY_STATUSES as readonly string[]).includes(value) ? (value as LibraryStatus) : undefined
})
const sort = computed(() => (String(route.query.sort) in SORTS ? String(route.query.sort) : 'updated'))

function setQuery(changes: Record<string, string | undefined>) {
  const next = { ...route.query, ...changes }
  for (const key of Object.keys(next)) if (!next[key]) delete next[key]
  router.replace({ query: next })
}

const visible = computed(() => {
  const needle = filter.value.trim().toLowerCase()
  return library.list
    .filter((e) => (!status.value || e.status === status.value) && (!needle || e.name.toLowerCase().includes(needle)))
    .sort(SORTS[sort.value].compare)
})

const stats = computed(() => [
  { label: 'Games', value: String(library.stats.total) },
  { label: 'Playing', value: String(library.stats.playing) },
  { label: 'Completed', value: String(library.stats.completed) },
  { label: 'Hours played', value: formatHours(library.stats.hours) },
  { label: 'Avg. rating', value: library.stats.averageRating ? `${library.stats.averageRating.toFixed(1)} ★` : '—' },
])
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <h1 class="text-3xl font-extrabold tracking-tight">My library</h1>
      <LibraryTransfer :can-export="library.count > 0" />
    </div>

    <p v-if="library.error" class="mb-4 rounded-lg bg-status-dropped/10 px-4 py-3 text-sm text-status-dropped" role="alert">
      {{ library.error }}
    </p>

    <StateMessage
      v-if="library.loaded && !library.count"
      title="Your library is empty"
      description="Browse games and add them as playing, backlog, wishlist, completed or dropped to start tracking."
    >
      <RouterLink to="/games" class="btn btn-primary">Browse games</RouterLink>
    </StateMessage>


    <template v-else>
      <dl class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div v-for="s in stats" :key="s.label" class="rounded-2xl border border-border bg-surface px-4 py-3">
          <dt class="text-xs font-semibold tracking-wide text-muted uppercase">{{ s.label }}</dt>
          <dd class="mt-1 text-2xl font-bold">{{ s.value }}</dd>
        </div>
      </dl>

      <div class="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        <button
          role="tab"
          :aria-selected="!status"
          class="btn"
          :class="{ 'btn-primary': !status }"
          @click="setQuery({ status: undefined })"
        >
          All <span class="opacity-70">{{ library.count }}</span>
        </button>
        <button
          v-for="s in LIBRARY_STATUSES"
          :key="s"
          role="tab"
          :aria-selected="status === s"
          class="btn"
          :class="{ 'btn-primary': status === s }"
          @click="setQuery({ status: s })"
        >
          <span class="size-2 rounded-full" :class="STATUS_META[s].dot" aria-hidden="true" />
          {{ STATUS_META[s].label }} <span class="opacity-70">{{ library.countsByStatus[s] }}</span>
        </button>
      </div>

      <div class="mb-8 grid gap-3 sm:grid-cols-[1fr_14rem]">
        <SearchField v-model="filter" placeholder="Filter your library…" />
        <select
          class="field"
          aria-label="Sort by"
          :value="sort"
          @change="setQuery({ sort: ($event.target as HTMLSelectElement).value })"
        >
          <option v-for="(s, key) in SORTS" :key="key" :value="key">{{ s.label }}</option>
        </select>
      </div>

      <StateMessage v-if="!visible.length" title="Nothing matches" description="Try another status or clear the filter." />

      <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <GameCard v-for="entry in visible" :key="entry.id" :game="entry">
          <div class="mt-2 flex items-center justify-between text-xs text-muted">
            <StarRating :model-value="entry.rating" readonly size="sm" />
            <span v-if="entry.hoursPlayed">{{ formatHours(entry.hoursPlayed) }} played</span>
          </div>
          <p v-if="entry.notes" class="mt-2 line-clamp-2 text-xs text-slate-400 italic">“{{ entry.notes }}”</p>
        </GameCard>
      </div>
    </template>
  </main>
</template>
