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
    <section class="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <h1 class="sr-only">Home</h1>
      <div class="max-w-xl">
        <SearchField v-model="query" large placeholder="Search for a game…" @submit="search" />
        <p class="mt-2 text-sm text-muted">Search 500,000+ games, then add them to your library.</p>
      </div>
    </section>

    <div class="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6">
      <section v-if="playing.length" aria-labelledby="playing-heading">
        <div class="mb-5 flex items-end justify-between">
          <h2 id="playing-heading" class="text-xl font-semibold">Continue playing</h2>
          <RouterLink to="/library?status=playing" class="text-sm text-accent hover:underline">See all</RouterLink>
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
          <h2 :id="`${row.id}-heading`" class="text-xl font-semibold">{{ row.title }}</h2>
          <RouterLink :to="row.to" class="text-sm text-accent hover:underline">See all</RouterLink>
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
