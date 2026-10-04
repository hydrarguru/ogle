<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import GameGrid from '@/components/GameGrid.vue'
import SearchField from '@/components/SearchField.vue'
import StateMessage from '@/components/StateMessage.vue'
import GameCard from '@/components/GameCard.vue'
import { listGames } from '@/api/rawg'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePageTitle } from '@/composables/usePageTitle'
import { useLibraryStore } from '@/stores/library'

usePageTitle(undefined)

const router = useRouter()
const library = useLibraryStore()
const query = ref('')

const popular = useAsyncData((signal) => listGames({ pageSize: 8, ordering: '-added' }, signal), () => 0)
const topRated = useAsyncData((signal) => listGames({ pageSize: 8, ordering: '-metacritic' }, signal), () => 0)

const playing = computed(() =>
  library.list
    .filter((e) => e.status === 'playing')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4),
)

function search() {
  const q = query.value.trim()
  router.push({ name: 'games', query: q ? { q } : {} })
}
</script>

<template>
  <div>
    <section class="relative overflow-hidden border-b border-border">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,213,128,0.16),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
        <h1 class="text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
          Every game you play, <span class="text-accent">in one place</span>.
        </h1>
        <p class="max-w-xl text-lg text-muted">
          Discover games from a library of 500,000+ titles, then track what you're playing, what's next, and what you thought.
        </p>
        <div class="w-full max-w-xl"><SearchField v-model="query" large placeholder="Search for a game…" @submit="search" /></div>
        <div class="flex gap-3">
          <RouterLink to="/games" class="btn btn-primary">Browse games</RouterLink>
          <RouterLink to="/library" class="btn">My library</RouterLink>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6">
      <section v-if="playing.length" aria-labelledby="playing-heading">
        <div class="mb-5 flex items-end justify-between">
          <h2 id="playing-heading" class="text-2xl font-bold">Continue playing</h2>
          <RouterLink to="/library?status=playing" class="text-sm text-accent hover:underline">View all</RouterLink>
        </div>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <GameCard v-for="entry in playing" :key="entry.id" :game="entry" />
        </div>
      </section>

      <section v-for="row in [
        { id: 'popular', title: 'Popular right now', source: popular, to: '/games?ordering=-added' },
        { id: 'top', title: 'Critically acclaimed', source: topRated, to: '/games?ordering=-metacritic' },
      ]" :key="row.id" :aria-labelledby="`${row.id}-heading`">
        <div class="mb-5 flex items-end justify-between">
          <h2 :id="`${row.id}-heading`" class="text-2xl font-bold">{{ row.title }}</h2>
          <RouterLink :to="row.to" class="text-sm text-accent hover:underline">See more</RouterLink>
        </div>
        <StateMessage
          v-if="row.source.error.value"
          tone="error"
          title="Couldn't load games"
          :description="row.source.error.value.message"
        >
          <button class="btn" @click="row.source.reload()">Try again</button>
        </StateMessage>
        <GameGrid v-else :games="row.source.data.value?.results" :loading="row.source.loading.value" />
      </section>
    </div>
  </div>
</template>
