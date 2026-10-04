<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/vue/16/solid'
import LibraryFormatGuide from './LibraryFormatGuide.vue'
import { useLibraryStore } from '@/stores/library'
import { EXAMPLE_JSON, ImportError, MAX_IMPORT_BYTES, parseLibraryExport, type ParsedImport } from '@/utils/libraryTransfer'

const emit = defineEmits<{ submit: [parsed: ParsedImport] }>()

const library = useLibraryStore()
const dialog = ref<HTMLDialogElement>()
const text = ref('')
/** Set when the text came from a file; the (possibly huge) text is then not shown in the editor. */
const fileName = ref<string | null>(null)
const fileError = ref<string | null>(null)

function reset() {
  text.value = ''
  fileName.value = null
  fileError.value = null
}
function show() {
  reset()
  dialog.value?.showModal()
}
function close() {
  dialog.value?.close()
}
defineExpose({ show })

const outcome = computed<{ parsed: ParsedImport } | { error: string } | null>(() => {
  if (fileError.value) return { error: fileError.value }
  if (!text.value.trim()) return null
  if (text.value.length > MAX_IMPORT_BYTES) return { error: 'This is too large to be a library export.' }
  try {
    return { parsed: parseLibraryExport(text.value) }
  } catch (e) {
    return { error: e instanceof ImportError ? e.message : 'Could not read this as JSON.' }
  }
})

const parsed = computed(() => (outcome.value && 'parsed' in outcome.value ? outcome.value.parsed : null))
const error = computed(() => (outcome.value && 'error' in outcome.value ? outcome.value.error : null))

const preview = computed(() => {
  if (!parsed.value) return null
  const total = parsed.value.entries.length
  const existing = parsed.value.entries.filter((e) => library.get(e.id)).length
  return { total, existing, fresh: total - existing, skipped: parsed.value.skipped }
})

const plural = (n: number) => `${n} game${n === 1 ? '' : 's'}`

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // allow choosing the same file again
  if (!file) return
  reset()
  fileName.value = file.name
  if (file.size > MAX_IMPORT_BYTES) {
    fileError.value = 'That file is too large to be a library export.'
    return
  }
  try {
    text.value = await file.text()
  } catch {
    fileError.value = 'Could not read that file.'
  }
}

function useExample() {
  reset()
  text.value = EXAMPLE_JSON
}

function submit() {
  if (!parsed.value?.entries.length) return
  emit('submit', parsed.value)
  close()
}
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="import-title"
    class="m-auto max-h-[92vh] w-[min(62rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-slate-100 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    @click.self="close"
    @close="reset"
  >
    <div class="p-5 sm:p-6">
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id="import-title" class="text-xl font-bold">Import library</h2>
          <p class="mt-1 text-sm text-muted">
            Choose a JSON file or paste the text. Games you already have keep whichever copy was updated most recently.
          </p>
        </div>
        <button type="button" class="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white" aria-label="Close" @click="close">
          <XMarkIcon class="size-5" />
        </button>
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div class="min-w-0 space-y-4">
          <div>
            <label class="btn cursor-pointer">
              <ArrowUpTrayIcon class="size-4" /> Choose JSON file…
              <input type="file" accept="application/json,.json" class="sr-only" data-testid="import-file-input" @change="onFile" />
            </label>
          </div>

          <div v-if="fileName" class="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg px-3 py-2 text-sm">
            <span class="truncate" data-testid="import-file-name">{{ fileName }}</span>
            <button type="button" class="shrink-0 text-xs text-muted hover:text-white" @click="reset">Remove</button>
          </div>
          <div v-else>
            <label for="import-text" class="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
              Or paste JSON
            </label>
            <textarea
              id="import-text"
              v-model="text"
              rows="12"
              spellcheck="false"
              autocomplete="off"
              placeholder='{ "format": "ogle-library", "version": 1, "entries": [ … ] }'
              class="field resize-y font-mono text-xs leading-relaxed"
              :aria-invalid="!!error"
              aria-describedby="import-result"
            />
          </div>

          <div id="import-result" aria-live="polite" class="min-h-12 text-sm">
            <p v-if="error" class="rounded-lg bg-status-dropped/10 px-3 py-2 text-status-dropped" role="alert" data-testid="import-error">
              {{ error }}
            </p>
            <div v-else-if="preview" class="rounded-lg bg-status-completed/10 px-3 py-2 text-status-completed" data-testid="import-preview">
              <template v-if="preview.total">
                Ready to import {{ plural(preview.total) }}: {{ preview.fresh }} new<template v-if="preview.existing">,
                  {{ preview.existing }} already in your library</template>.
              </template>
              <template v-else>No games found in this data.</template>
              <span v-if="preview.skipped" class="block text-status-wishlist">
                {{ preview.skipped }} invalid {{ preview.skipped === 1 ? 'entry' : 'entries' }} will be skipped.
              </span>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button type="button" class="btn" @click="close">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="!parsed?.entries.length" data-testid="import-submit" @click="submit">
              Import{{ preview?.total ? ` ${plural(preview.total)}` : '' }}
            </button>
          </div>
        </div>

        <LibraryFormatGuide @use-example="useExample" />
      </div>
    </div>
  </dialog>
</template>
