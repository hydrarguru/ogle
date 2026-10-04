<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import SearchField from './SearchField.vue'
import { useLibraryStore } from '@/stores/library'

const router = useRouter()
const library = useLibraryStore()
const query = ref('')

function search() {
  const q = query.value.trim()
  router.push({ name: 'games', query: q ? { q } : {} })
}

const linkClass = 'rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-white'
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-2 text-xl font-extrabold tracking-tight">
        <span class="inline-block size-6 rounded-full border-[5px] border-accent" aria-hidden="true" />
        ogle
      </RouterLink>

      <nav class="flex items-center gap-1" aria-label="Main">
        <RouterLink to="/games" :class="linkClass" active-class="!text-white bg-white/5">Browse</RouterLink>
        <RouterLink to="/library" :class="linkClass" active-class="!text-white bg-white/5">
          Library
          <span
            v-if="library.count"
            class="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-xs font-bold text-bg"
            :aria-label="`${library.count} games`"
          >
            {{ library.count }}
          </span>
        </RouterLink>
      </nav>

      <div class="ml-auto hidden w-full max-w-xs sm:block">
        <SearchField v-model="query" @submit="search" />
      </div>
    </div>
  </header>
</template>
