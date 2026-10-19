<script setup lang="ts">
import { computed, ref } from 'vue'
import { STATUS_META } from '@/constants/status'
import { useLibraryStore } from '@/stores/library'
import { LIBRARY_STATUSES, type LibraryEntry, type LibraryStatus } from '@/types/library'
import { EVENT_LABELS } from '@/utils/statusHistory'

const props = defineProps<{ entry: LibraryEntry }>()

const library = useLibraryStore()

const pad = (n: number) => String(n).padStart(2, '0')
/** ISO date-time → local YYYY-MM-DD for a date input. */
function toDateInput(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
/** Local YYYY-MM-DD → ISO at local noon, so the day survives time zone changes. */
function fromDateInput(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12).toISOString()
}

const today = toDateInput(new Date().toISOString())
const history = computed(() => props.entry.history)

function changeDate(index: number, value: string) {
  const at = fromDateInput(value)
  if (!at || toDateInput(history.value[index].at) === value) return
  library.setHistory(props.entry.id, history.value.map((e, i) => (i === index ? { ...e, at } : e)))
}

function removeEvent(index: number) {
  library.setHistory(props.entry.id, history.value.filter((_, i) => i !== index))
}

const newStatus = ref<LibraryStatus>('playing')
const newDate = ref(today)
function addEvent() {
  const at = fromDateInput(newDate.value)
  if (at) library.setHistory(props.entry.id, [...history.value, { status: newStatus.value, at }])
}
</script>

<template>
  <div>
    <p class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">History</p>
    <ol class="space-y-1.5">
      <li v-for="(event, i) in history" :key="`${event.status}-${event.at}-${i}`" class="flex items-center gap-2 text-sm">
        <span class="size-2 shrink-0 rounded-full" :class="STATUS_META[event.status].dot" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate">{{ EVENT_LABELS[event.status] }}</span>
        <input
          type="date"
          class="field !w-auto !px-2 !py-1"
          :value="toDateInput(event.at)"
          :max="today"
          :aria-label="`Date: ${EVENT_LABELS[event.status]}`"
          @change="changeDate(i, ($event.target as HTMLInputElement).value)"
        />
        <button
          type="button"
          class="cursor-pointer px-1 text-muted hover:text-status-dropped disabled:invisible"
          :disabled="history.length === 1"
          :aria-label="`Remove ${EVENT_LABELS[event.status]} event`"
          @click="removeEvent(i)"
        >
          ×
        </button>
      </li>
    </ol>
    <form class="mt-3 flex flex-wrap items-center gap-2" @submit.prevent="addEvent">
      <select v-model="newStatus" class="field !w-auto !px-2 !py-1" aria-label="Event">
        <option v-for="s in LIBRARY_STATUSES" :key="s" :value="s">{{ EVENT_LABELS[s] }}</option>
      </select>
      <input v-model="newDate" type="date" class="field !w-auto !px-2 !py-1" :max="today" aria-label="Date" required />
      <button type="submit" class="btn !px-3 !py-1">Add</button>
    </form>
  </div>
</template>
