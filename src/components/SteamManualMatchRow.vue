<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { listGames } from '@/api/rawg'
import type { GameSummary } from '@/types/rawg'
import type { SkippedGame } from '@/utils/steamImport'

const props = defineProps<{ game: SkippedGame; picked?: GameSummary }>()
const emit = defineEmits<{ pick: [game: GameSummary]; clear: [] }>()

const open = ref(false)
const query = ref(props.game.name)
const results = ref<GameSummary[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searched = ref(false)
let controller: AbortController | null = null

onBeforeUnmount(() => controller?.abort())

async function search() {
  const text = query.value.trim()
  if (!text) return
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = null
  try {
    results.value = (await listGames({ search: text, pageSize: 6 }, controller.signal)).results
    searched.value = true
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    error.value = 'Could not search RAWG. Try again in a moment.'
  } finally {
    loading.value = false
  }
}

function toggle() {
  open.value = !open.value
  if (open.value && !searched.value) void search()
}
function choose(game: GameSummary) {
  emit('pick', game)
  open.value = false
}
</script>

<template>
  <li class="rounded-lg border border-border bg-bg px-3 py-2" data-testid="steam-manual-row">
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <span class="block truncate">{{ game.name }}</span>
        <span v-if="picked" class="block truncate text-xs text-status-completed" data-testid="steam-manual-picked">
          → {{ picked.name }}<template v-if="picked.released"> ({{ picked.released.slice(0, 4) }})</template>
        </span>
        <span v-else-if="game.hours" class="block text-xs text-muted">{{ game.hours }} h</span>
      </div>
      <div class="flex shrink-0 gap-2 text-xs">
        <button v-if="picked" type="button" class="text-muted hover:text-white" @click="emit('clear')">Remove</button>
        <button type="button" class="text-muted hover:text-white" :aria-expanded="open" @click="toggle">
          {{ open ? 'Close' : picked ? 'Change' : 'Find match' }}
        </button>
      </div>
    </div>

    <div v-if="open" class="mt-2 space-y-2">
      <form class="flex gap-2" @submit.prevent="search">
        <input v-model="query" type="text" class="field py-1 text-sm" :aria-label="`Search RAWG for ${game.name}`" />
        <button type="submit" class="btn" :disabled="loading || !query.trim()">Search</button>
      </form>
      <p v-if="error" class="text-xs text-status-dropped" role="alert">{{ error }}</p>
      <p v-else-if="loading" class="text-xs text-muted">Searching…</p>
      <p v-else-if="searched && !results.length" class="text-xs text-muted">No games found. Try a shorter title.</p>
      <ul v-else class="space-y-1">
        <li v-for="r in results" :key="r.id">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left hover:bg-white/5"
            data-testid="steam-manual-option"
            @click="choose(r)"
          >
            <img v-if="r.background_image" :src="r.background_image" alt="" class="h-9 w-14 shrink-0 rounded object-cover" loading="lazy" />
            <span v-else class="h-9 w-14 shrink-0 rounded bg-white/5" />
            <span class="min-w-0 truncate">{{ r.name }}</span>
            <span v-if="r.released" class="ml-auto shrink-0 text-xs text-muted">{{ r.released.slice(0, 4) }}</span>
          </button>
        </li>
      </ul>
    </div>
  </li>
</template>
