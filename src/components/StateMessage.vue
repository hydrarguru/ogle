<script setup lang="ts">
defineProps<{ title: string; description?: string; tone?: 'neutral' | 'error' }>()
</script>

<template>
  <div
    class="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center"
    :class="tone === 'error' ? 'border-status-dropped/50 bg-status-dropped/5' : 'border-border bg-surface/50'"
    :role="tone === 'error' ? 'alert' : undefined"
  >
    <h2 class="text-lg font-semibold">{{ title }}</h2>
    <p v-if="description" class="max-w-md text-sm text-muted">{{ description }}</p>
    <div class="mt-2 flex flex-wrap justify-center gap-3"><slot /></div>
  </div>
</template>
