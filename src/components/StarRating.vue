<script setup lang="ts">
import { StarIcon as StarSolid } from '@heroicons/vue/24/solid'
import { StarIcon as StarOutline } from '@heroicons/vue/24/outline'

const props = withDefaults(defineProps<{ modelValue: number | null; readonly?: boolean; size?: 'sm' | 'md' }>(), {
  readonly: false,
  size: 'md',
})
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

function select(star: number) {
  // Clicking the current rating clears it.
  emit('update:modelValue', props.modelValue === star ? null : star)
}
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5"
    :role="readonly ? 'img' : 'group'"
    :aria-label="readonly ? (modelValue ? `Rated ${modelValue} out of 5` : 'Not rated') : 'Your rating'"
  >
    <template v-for="star in 5" :key="star">
      <component
        :is="star <= (modelValue ?? 0) ? StarSolid : StarOutline"
        v-if="readonly"
        :class="[size === 'sm' ? 'size-4' : 'size-5', star <= (modelValue ?? 0) ? 'text-accent' : 'text-border']"
      />
      <button
        v-else
        type="button"
        class="cursor-pointer rounded p-0.5 transition hover:scale-110"
        :aria-label="`${star} star${star > 1 ? 's' : ''}`"
        :aria-pressed="modelValue === star"
        @click="select(star)"
      >
        <component
          :is="star <= (modelValue ?? 0) ? StarSolid : StarOutline"
          class="size-6"
          :class="star <= (modelValue ?? 0) ? 'text-accent' : 'text-muted'"
        />
      </button>
    </template>
  </div>
</template>
