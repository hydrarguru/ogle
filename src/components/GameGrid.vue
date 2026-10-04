<script setup lang="ts">
import GameCard from './GameCard.vue'
import type { GameSummary } from '@/types/rawg'
import { toGameRef } from '@/utils/game'

defineProps<{ games?: GameSummary[]; loading?: boolean; skeletons?: number }>()
</script>

<template>
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" :aria-busy="loading">
    <template v-if="loading && !games?.length">
      <div
        v-for="n in skeletons ?? 8"
        :key="n"
        class="animate-pulse overflow-hidden rounded-2xl border border-border bg-surface"
        aria-hidden="true"
      >
        <div class="aspect-16/10 bg-surface-2" />
        <div class="space-y-2 p-4">
          <div class="h-4 w-3/4 rounded bg-surface-2" />
          <div class="h-3 w-1/3 rounded bg-surface-2" />
        </div>
      </div>
    </template>
    <GameCard v-for="game in games" :key="game.id" :game="toGameRef(game)" :metacritic="game.metacritic" />
  </div>
</template>
