<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StatusMenu from './StatusMenu.vue'
import type { GameRef } from '@/types/library'
import { releaseYear, resizeImage } from '@/utils/game'

const props = defineProps<{ game: GameRef; metacritic?: number | null }>()

const image = computed(() => resizeImage(props.game.image, 420))
const subtitle = computed(() => [releaseYear(props.game.released), props.game.genres[0]].filter(Boolean).join(' · '))
</script>

<template>
  <article
    class="group relative flex flex-col rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-muted"
  >
    <RouterLink :to="{ name: 'game', params: { id: game.id } }" class="block overflow-hidden rounded-t-2xl">
      <div class="aspect-16/10 bg-surface-2">
        <img
          v-if="image"
          :src="image"
          :alt="`${game.name} cover`"
          loading="lazy"
          class="size-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div v-else class="flex size-full items-center justify-center text-sm text-muted">No image</div>
      </div>
    </RouterLink>

    <div class="absolute top-2.5 right-2.5">
      <StatusMenu :game="game" />
    </div>
    <span
      v-if="metacritic"
      class="absolute top-2.5 left-2.5 rounded-md border border-status-completed/60 bg-black/70 px-1.5 py-0.5 text-xs font-bold text-status-completed backdrop-blur"
      title="Metacritic score"
    >
      {{ metacritic }}
    </span>

    <div class="flex flex-1 flex-col gap-1 p-4">
      <RouterLink :to="{ name: 'game', params: { id: game.id } }" class="line-clamp-2 font-semibold hover:text-accent">
        {{ game.name }}
      </RouterLink>
      <p class="text-xs text-muted">{{ subtitle }}</p>
      <slot />
    </div>
  </article>
</template>
