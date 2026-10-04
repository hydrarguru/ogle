<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/vue/16/solid'
import LibraryImportDialog from './LibraryImportDialog.vue'
import SteamImportDialog, { type SteamImportSubmission } from './SteamImportDialog.vue'
import { useLibraryStore } from '@/stores/library'
import { exportFilename, serializeLibrary, type ParsedImport } from '@/utils/libraryTransfer'

defineProps<{ canExport?: boolean }>()

const library = useLibraryStore()
const importDialog = ref<InstanceType<typeof LibraryImportDialog>>()
const steamDialog = ref<InstanceType<typeof SteamImportDialog>>()
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

async function importParsed({ entries, skipped }: ParsedImport) {
  const { added, updated, kept } = await library.importEntries(entries)
  const parts = [`${added} added`, `${updated} updated`, `${kept} unchanged (local copy was newer or identical)`]
  if (skipped) parts.push(`${skipped} invalid skipped`)
  message.value = { text: `Import complete: ${parts.join(', ')}.`, ok: !library.error }
}

async function importSteam({ plan, unmatched, failed }: SteamImportSubmission) {
  await library.importEntries(plan.entries)
  const parts = [`${plan.added} added`, `${plan.updated} updated`]
  if (unmatched) parts.push(`${unmatched} not matched`)
  if (failed) parts.push(`${failed} could not be looked up`)
  message.value = { text: `Steam import complete: ${parts.join(', ')}.`, ok: !library.error }
}
</script>

<template>
  <div class="flex flex-col items-end gap-2">
    <div class="flex gap-2">
      <button v-if="canExport" type="button" class="btn" @click="exportLibrary">
        <ArrowDownTrayIcon class="size-4" /> Export
      </button>
      <button type="button" class="btn" @click="importDialog?.show()">
        <ArrowUpTrayIcon class="size-4" /> Import
      </button>
      <button type="button" class="btn" @click="steamDialog?.show()">
        <ArrowUpTrayIcon class="size-4" /> Import from Steam
      </button>
      <LibraryImportDialog ref="importDialog" @submit="importParsed" />
      <SteamImportDialog ref="steamDialog" @submit="importSteam" />
    </div>
    <p v-if="message" class="max-w-md text-right text-xs" :class="message.ok ? 'text-status-completed' : 'text-status-dropped'" role="status">
      {{ message.text }}
    </p>
  </div>
</template>
