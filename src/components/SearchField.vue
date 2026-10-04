<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'

withDefaults(defineProps<{ placeholder?: string; large?: boolean }>(), { placeholder: 'Search games…' })
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <form class="relative w-full" role="search" @submit.prevent="emit('submit')">
    <MagnifyingGlassIcon
      class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
      :class="large ? 'size-6' : 'size-5'"
    />
    <input
      v-model="model"
      type="search"
      class="field pl-10"
      :class="large ? 'py-4 pl-12 text-base' : ''"
      :placeholder="placeholder"
      :aria-label="placeholder"
    />
  </form>
</template>
