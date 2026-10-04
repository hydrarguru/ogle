<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/vue/16/solid'
import { useLibraryStore } from '@/stores/library'
import {
  exportFilename,
  ImportError,
  MAX_IMPORT_BYTES,
  parseLibraryExport,
  serializeLibrary,
} from '@/utils/libraryTransfer'

defineProps<{ canExport?: boolean }>()

const library = useLibraryStore()
const input = ref<HTMLInputElement>()
const message = ref<{ text: string; ok: boolean } | null>(null)

function exportLibrary() {
  const blob = new Blob([serializeLibrary(library.list)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename()
  link.click()
  URL.revokeObjectURL(url)
  message.value = { text: `Exported ${library.count} game${library.count === 1 ? '' : 's'}.`, ok: true }
}

async function onFile(event: Event) {
  const el = event.target as HTMLInputElement
  const file = el.files?.[0]
  el.value = '' // allow re-selecting the same file
  if (!file) return
  try {
    if (file.size > MAX_IMPORT_BYTES) throw new ImportError('That file is too large to be a library export.')
    const { entries, skipped } = parseLibraryExport(await file.text())
    const { added, updated, kept } = await library.importEntries(entries)
    const parts = [`${added} added`, `${updated} updated`, `${kept} unchanged (local copy was newer or identical)`]
    if (skipped) parts.push(`${skipped} invalid skipped`)
    message.value = { text: `Import complete: ${parts.join(', ')}.`, ok: !library.error }
  } catch (e) {
    message.value = { text: e instanceof ImportError ? e.message : 'Could not read that file.', ok: false }
  }
}
</script>

<template>
  <div class="flex flex-col items-end gap-2">
    <div class="flex gap-2">
      <button v-if="canExport" type="button" class="btn" @click="exportLibrary">
        <ArrowDownTrayIcon class="size-4" /> Export
      </button>
      <button type="button" class="btn" @click="input?.click()">
        <ArrowUpTrayIcon class="size-4" /> Import
      </button>
      <input ref="input" type="file" accept="application/json,.json" class="hidden" data-testid="import-input" @change="onFile" />
    </div>
    <p v-if="message" class="max-w-md text-right text-xs" :class="message.ok ? 'text-status-completed' : 'text-status-dropped'" role="status">
      {{ message.text }}
    </p>
  </div>
</template>
