<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'

const props = defineProps<{ page: number; pageCount: number }>()
const emit = defineEmits<{ change: [page: number] }>()

/** First, last and a window around the current page, with `null` marking gaps. */
const items = computed<(number | null)[]>(() => {
  const { page, pageCount } = props
  const wanted = new Set([1, pageCount, page - 1, page, page + 1])
  const pages = [...wanted].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const out: (number | null)[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push(null)
    out.push(p)
  })
  return out
})
</script>

<template>
  <nav v-if="pageCount > 1" class="flex items-center justify-center gap-1.5" aria-label="Pagination">
    <button class="btn px-2" :disabled="page <= 1" aria-label="Previous page" @click="emit('change', page - 1)">
      <ChevronLeftIcon class="size-5" />
    </button>
    <template v-for="(item, i) in items" :key="i">
      <span v-if="item === null" class="px-1 text-muted" aria-hidden="true">…</span>
      <button
        v-else
        class="btn min-w-10"
        :class="{ 'btn-primary': item === page }"
        :aria-current="item === page ? 'page' : undefined"
        @click="emit('change', item)"
      >
        {{ item }}
      </button>
    </template>
    <button class="btn px-2" :disabled="page >= pageCount" aria-label="Next page" @click="emit('change', page + 1)">
      <ChevronRightIcon class="size-5" />
    </button>
  </nav>
</template>
