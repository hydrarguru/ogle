<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/16/solid'
import StarRating from './StarRating.vue'
import { STATUS_META } from '@/constants/status'
import { MAX_HOURS, MAX_NOTES_LENGTH, useLibraryStore } from '@/stores/library'
import { LIBRARY_STATUSES, type GameRef, type LibraryStatus } from '@/types/library'
import { changeDateBounds } from '@/utils/statusHistory'

const props = defineProps<{ game: GameRef }>()

const library = useLibraryStore()
const entry = computed(() => library.get(props.game.id))

const hours = ref(entry.value?.hoursPlayed ?? 0)
const notes = ref(entry.value?.notes ?? '')
const confirmingRemove = ref(false)

// Keep the form in sync when the entry changes from elsewhere (other tab, status menu).
watch(entry, (e) => {
  hours.value = e?.hoursPlayed ?? 0
  notes.value = e?.notes ?? ''
  if (!e) confirmingRemove.value = false
})

let notesTimer: ReturnType<typeof setTimeout> | undefined
function saveNotes() {
  clearTimeout(notesTimer)
  if (entry.value && notes.value !== entry.value.notes) library.update(props.game.id, { notes: notes.value })
}
function queueNotesSave() {
  clearTimeout(notesTimer)
  notesTimer = setTimeout(saveNotes, 600)
}
onBeforeUnmount(saveNotes)

function saveHours() {
  const value = Number(hours.value)
  library.update(props.game.id, { hoursPlayed: Number.isFinite(value) ? value : 0 })
}

function setStatus(status: LibraryStatus) {
  return library.add(props.game, status)
}

async function remove() {
  await library.remove(props.game.id)
  confirmingRemove.value = false
}

/** `YYYY-MM-DD` in local time, as date inputs expect. */
function toDateInput(iso: string | undefined) {
  if (!iso) return undefined
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function moveChange(index: number, value: string) {
  // Midday keeps the chosen day intact across time zones.
  if (value) library.moveHistoryChange(props.game.id, index, new Date(`${value}T12:00:00`).toISOString())
}

const history = computed(() =>
  (entry.value?.history ?? []).map((change, index, all) => {
    const { min, max } = changeDateBounds(all, index)
    return { ...change, index, value: toDateInput(change.at), min: toDateInput(min), max: toDateInput(max) }
  }),
)

const addedOn = computed(() =>
  entry.value ? new Date(entry.value.addedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '',
)
</script>

<template>
  <section class="space-y-5 rounded-2xl border border-border bg-surface p-5" aria-labelledby="library-heading">
    <div>
      <h2 id="library-heading" class="text-lg font-bold">{{ entry ? 'In your library' : 'Add to your library' }}</h2>
      <p v-if="entry" class="text-xs text-muted">Added {{ addedOn }}</p>
    </div>

    <p v-if="library.error" class="rounded-lg bg-status-dropped/10 px-3 py-2 text-sm text-status-dropped" role="alert">
      {{ library.error }}
    </p>

    <div>
      <p class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Status</p>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Status">
        <button
          v-for="status in LIBRARY_STATUSES"
          :key="status"
          type="button"
          class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition"
          :class="
            entry?.status === status
              ? [STATUS_META[status].badge, 'border-current']
              : 'border-border text-slate-300 hover:border-muted'
          "
          :aria-pressed="entry?.status === status"
          @click="setStatus(status)"
        >
          <span class="size-2 rounded-full" :class="STATUS_META[status].dot" aria-hidden="true" />
          {{ STATUS_META[status].label }}
        </button>
      </div>
    </div>

    <template v-if="entry">
      <div>
        <p class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">History</p>
        <ol class="space-y-1.5" aria-label="Status history">
          <li v-for="change in history" :key="change.index" class="flex items-center gap-2 text-sm">
            <span class="size-2 shrink-0 rounded-full" :class="STATUS_META[change.status].dot" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate">{{ STATUS_META[change.status].event }}</span>
            <input
              type="date"
              class="field !w-auto !py-1"
              :value="change.value"
              :min="change.min"
              :max="change.max"
              :aria-label="`Date ${STATUS_META[change.status].event.toLowerCase()}`"
              @change="moveChange(change.index, ($event.target as HTMLInputElement).value)"
            />
            <button
              v-if="change.index < history.length - 1"
              type="button"
              class="cursor-pointer rounded p-1 text-muted hover:text-status-dropped"
              :aria-label="`Remove ${STATUS_META[change.status].event.toLowerCase()} from history`"
              @click="library.removeHistoryChange(game.id, change.index)"
            >
              <XMarkIcon class="size-4" />
            </button>
            <span v-else class="w-6" aria-hidden="true" />
          </li>
        </ol>
      </div>

      <div>
        <p class="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Your rating</p>
        <StarRating :model-value="entry.rating" @update:model-value="library.update(game.id, { rating: $event })" />
      </div>

      <div>
        <label for="hours" class="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
          Hours played
        </label>
        <input
          id="hours"
          v-model.number="hours"
          type="number"
          min="0"
          :max="MAX_HOURS"
          step="0.5"
          inputmode="decimal"
          class="field w-32"
          @change="saveHours"
        />
      </div>

      <div>
        <label for="notes" class="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">Notes</label>
        <textarea
          id="notes"
          v-model="notes"
          rows="4"
          :maxlength="MAX_NOTES_LENGTH"
          placeholder="Thoughts, progress, where you left off…"
          class="field resize-y"
          @input="queueNotesSave"
          @blur="saveNotes"
        />
      </div>

      <div class="border-t border-border pt-4">
        <button v-if="!confirmingRemove" type="button" class="text-sm text-muted hover:text-status-dropped" @click="confirmingRemove = true">
          Remove from library
        </button>
        <div v-else class="flex items-center gap-3 text-sm">
          <span>Remove this game and its notes?</span>
          <button type="button" class="btn !border-status-dropped/60 !text-status-dropped" @click="remove">Remove</button>
          <button type="button" class="btn" @click="confirmingRemove = false">Cancel</button>
        </div>
      </div>
    </template>
  </section>
</template>
