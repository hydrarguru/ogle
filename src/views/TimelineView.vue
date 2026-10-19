<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/vue/20/solid'
import StateMessage from '@/components/StateMessage.vue'
import StatusTimeline from '@/components/StatusTimeline.vue'
import { STATUS_META } from '@/constants/status'
import { usePageTitle } from '@/composables/usePageTitle'
import { useLibraryStore } from '@/stores/library'
import { LIBRARY_STATUSES, type LibraryStatus } from '@/types/library'

usePageTitle('Timeline')

const ZOOMS = [1, 2, 4, 8]

const library = useLibraryStore()
const hidden = ref<LibraryStatus[]>([])
const zoomIndex = ref(0)

function toggle(status: LibraryStatus) {
  hidden.value = hidden.value.includes(status) ? hidden.value.filter((s) => s !== status) : [...hidden.value, status]
}

const changes = computed(() => library.list.reduce((sum, e) => sum + e.history.length, 0))
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold tracking-tight">Timeline</h1>
      <p class="mt-1 text-sm text-muted">
        When you started, finished, dropped or shelved each game. Fix a date from the game's page.
      </p>
    </div>

    <p v-if="library.error" class="mb-4 rounded-lg bg-status-dropped/10 px-4 py-3 text-sm text-status-dropped" role="alert">
      {{ library.error }}
    </p>

    <StateMessage
      v-if="library.loaded && !library.count"
      title="Nothing on your timeline yet"
      description="Add games to your library and change their status as you play; every change shows up here."
    >
      <RouterLink to="/games" class="btn btn-primary">Browse games</RouterLink>
    </StateMessage>

    <template v-else-if="library.count">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2" role="group" aria-label="Show marks for">
          <button
            v-for="s in LIBRARY_STATUSES"
            :key="s"
            type="button"
            class="btn !py-1.5"
            :class="{ 'opacity-50': hidden.includes(s) }"
            :aria-pressed="!hidden.includes(s)"
            @click="toggle(s)"
          >
            <span class="size-2.5 rounded-full" :class="STATUS_META[s].dot" aria-hidden="true" />
            {{ STATUS_META[s].event }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-muted">{{ library.count }} games · {{ changes }} changes</span>
          <button
            type="button"
            class="btn !px-2.5"
            aria-label="Zoom out"
            :disabled="zoomIndex === 0"
            @click="zoomIndex--"
          >
            <MagnifyingGlassMinusIcon class="size-4" />
          </button>
          <button
            type="button"
            class="btn !px-2.5"
            aria-label="Zoom in"
            :disabled="zoomIndex === ZOOMS.length - 1"
            @click="zoomIndex++"
          >
            <MagnifyingGlassPlusIcon class="size-4" />
          </button>
        </div>
      </div>

      <StatusTimeline :entries="library.list" :hidden="hidden" :zoom="ZOOMS[zoomIndex]" />
    </template>
  </main>
</template>
