<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { CheckIcon, ChevronDownIcon, PlusIcon } from '@heroicons/vue/16/solid'
import { STATUS_META } from '@/constants/status'
import { useLibraryStore } from '@/stores/library'
import { LIBRARY_STATUSES, type GameRef } from '@/types/library'

const props = defineProps<{ game: GameRef }>()

const library = useLibraryStore()
const entry = computed(() => library.get(props.game.id))
const open = ref(false)
const root = ref<HTMLElement>()

function onDocumentPointer(event: Event) {
  if (root.value && !root.value.contains(event.target as Node)) close()
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}
function show() {
  open.value = true
  document.addEventListener('pointerdown', onDocumentPointer)
  document.addEventListener('keydown', onKeydown)
}
function close() {
  open.value = false
  document.removeEventListener('pointerdown', onDocumentPointer)
  document.removeEventListener('keydown', onKeydown)
}
onBeforeUnmount(close)

async function choose(status: (typeof LIBRARY_STATUSES)[number]) {
  close()
  await library.add(props.game, status)
}
async function remove() {
  close()
  await library.remove(props.game.id)
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur transition"
      :class="
        entry
          ? [STATUS_META[entry.status].badge, 'border-transparent shadow-[inset_0_0_0_999px_rgb(11_13_18/0.85)]']
          : 'border-white/20 bg-black/60 text-white hover:bg-black/80'
      "
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="entry ? `${game.name}: ${STATUS_META[entry.status].label}. Change status` : `Add ${game.name} to library`"
      @click="open ? close() : show()"
    >
      <template v-if="entry">
        {{ STATUS_META[entry.status].label }}
        <ChevronDownIcon class="size-3.5" />
      </template>
      <template v-else>
        <PlusIcon class="size-3.5" />
        Add
      </template>
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface-2 py-1 shadow-xl shadow-black/50"
    >
      <button
        v-for="status in LIBRARY_STATUSES"
        :key="status"
        type="button"
        role="menuitemradio"
        :aria-checked="entry?.status === status"
        class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
        @click="choose(status)"
      >
        <span class="size-2 rounded-full" :class="STATUS_META[status].dot" aria-hidden="true" />
        <span class="flex-1">{{ STATUS_META[status].label }}</span>
        <CheckIcon v-if="entry?.status === status" class="size-4 text-accent" />
      </button>
      <button
        v-if="entry"
        type="button"
        role="menuitem"
        class="w-full cursor-pointer border-t border-border px-3 py-2 text-left text-sm text-status-dropped hover:bg-white/5"
        @click="remove"
      >
        Remove from library
      </button>
    </div>
  </div>
</template>
