<script setup lang="ts">
import { STATUS_META } from '@/constants/status'
import type { LibraryStatus } from '@/types/library'

defineProps<{ status: LibraryStatus }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
    :class="STATUS_META[status].badge"
  >
    <span class="size-1.5 rounded-full" :class="STATUS_META[status].dot" aria-hidden="true" />
    {{ STATUS_META[status].label }}
  </span>
</template>
