<script setup lang="ts">
import { ref } from 'vue'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/vue/16/solid'
import { EXAMPLE_JSON, FORMAT_FIELDS } from '@/utils/libraryTransfer'

const emit = defineEmits<{ useExample: [] }>()

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(EXAMPLE_JSON)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* clipboard unavailable; the example is still selectable on screen */
  }
}
</script>

<template>
  <section aria-labelledby="format-heading" class="min-w-0 space-y-4">
    <div>
      <h3 id="format-heading" class="text-sm font-bold">Expected format</h3>
      <p class="mt-1 text-xs text-muted">
        An object with a <code class="text-slate-300">format</code> and <code class="text-slate-300">version</code>, and
        an <code class="text-slate-300">entries</code> list. Exporting your library produces exactly this.
      </p>
    </div>

    <div class="relative">
      <pre
        class="max-h-72 overflow-auto rounded-xl border border-border bg-bg p-3 text-xs leading-relaxed text-slate-300"
        tabindex="0"
        aria-label="Example library JSON"
      ><code>{{ EXAMPLE_JSON }}</code></pre>
      <div class="mt-2 flex flex-wrap gap-2">
        <button type="button" class="btn !px-3 !py-1.5 text-xs" @click="copy">
          <component :is="copied ? CheckIcon : ClipboardDocumentIcon" class="size-4" />
          {{ copied ? 'Copied' : 'Copy example' }}
        </button>
        <button type="button" class="btn !px-3 !py-1.5 text-xs" @click="emit('useExample')">Paste example into editor</button>
      </div>
    </div>

    <div>
      <h4 class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Fields of each entry</h4>
      <dl class="divide-y divide-border rounded-xl border border-border text-xs">
        <div v-for="field in FORMAT_FIELDS" :key="field.name" class="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-0.5 px-3 py-2">
          <dt class="font-mono text-slate-200">
            {{ field.name }}
            <span v-if="field.required" class="ml-1 font-sans font-semibold text-accent" title="Required">*</span>
          </dt>
          <dd class="min-w-0 break-words text-muted">
            <span class="font-mono text-slate-400">{{ field.type }}</span>
            <span class="block">{{ field.note }}</span>
          </dd>
        </div>
      </dl>
      <p class="mt-2 text-xs text-muted"><span class="font-semibold text-accent">*</span> required. Entries missing one are skipped.</p>
    </div>
  </section>
</template>
