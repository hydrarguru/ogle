<script setup lang="ts">
import { computed, ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/16/solid'
import { fetchSteamLibrary, matchSteamGames, type MatchResult } from '@/api/steam'
import { useLibraryStore } from '@/stores/library'
import { buildSteamEntries, listSkipped, type SteamImportPlan } from '@/utils/steamImport'
import { parseSteamProfile } from '@/utils/steamProfile'

export interface SteamImportSubmission {
  plan: SteamImportPlan
  unmatched: number
  failed: number
}

const emit = defineEmits<{ submit: [submission: SteamImportSubmission] }>()

const library = useLibraryStore()
const dialog = ref<HTMLDialogElement>()
const profile = ref('')
const onlyPlayed = ref(true)
const phase = ref<'idle' | 'fetching' | 'matching' | 'ready'>('idle')
const progress = ref({ done: 0, total: 0 })
const error = ref<string | null>(null)
const result = ref<MatchResult | null>(null)
let controller: AbortController | null = null

function cancel() {
  controller?.abort()
  controller = null
}
function reset() {
  cancel()
  phase.value = 'idle'
  error.value = null
  result.value = null
  progress.value = { done: 0, total: 0 }
}
function show() {
  profile.value = ''
  reset()
  dialog.value?.showModal()
}
function close() {
  dialog.value?.close()
}
defineExpose({ show })

const valid = computed(() => parseSteamProfile(profile.value) !== null)
const busy = computed(() => phase.value === 'fetching' || phase.value === 'matching')
const plan = computed(() => (result.value ? buildSteamEntries(result.value.matches, library.get) : null))
const unmatchedList = computed(() => listSkipped(result.value?.unmatched ?? []))
const failedList = computed(() => listSkipped(result.value?.failed ?? []))
const plural = (n: number, one = 'game') => `${n} ${one}${n === 1 ? '' : 's'}`

async function load() {
  if (!valid.value || busy.value) return
  reset()
  controller = new AbortController()
  const { signal } = controller
  try {
    phase.value = 'fetching'
    let games = await fetchSteamLibrary(profile.value, signal)
    if (onlyPlayed.value) games = games.filter((g) => g.playtimeMinutes > 0)
    if (!games.length) {
      error.value = onlyPlayed.value
        ? 'No played games found on this profile. Untick “Only games I have played” to import unplayed ones too.'
        : 'This profile has no games.'
      phase.value = 'idle'
      return
    }
    phase.value = 'matching'
    progress.value = { done: 0, total: games.length }
    result.value = await matchSteamGames(games, (p) => (progress.value = p), signal)
    phase.value = 'ready'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
    phase.value = 'idle'
  }
}

function submit() {
  if (!plan.value?.entries.length || !result.value) return
  emit('submit', { plan: plan.value, unmatched: result.value.unmatched.length, failed: result.value.failed.length })
  close()
}
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="steam-title"
    class="m-auto max-h-[92vh] w-[min(36rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-slate-100 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    @click.self="close"
    @close="reset"
  >
    <form class="space-y-4 p-5 sm:p-6" @submit.prevent="load">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 id="steam-title" class="text-xl font-bold">Import from Steam</h2>
          <p class="mt-1 text-sm text-muted">
            Paste the link to your Steam profile to import your games and playtime. Your profile's
            <em>Game details</em> must be public.
          </p>
        </div>
        <button type="button" class="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white" aria-label="Close" @click="close">
          <XMarkIcon class="size-5" />
        </button>
      </div>

      <div>
        <label for="steam-profile" class="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">Profile link</label>
        <input
          id="steam-profile"
          v-model="profile"
          type="text"
          inputmode="url"
          autocomplete="off"
          spellcheck="false"
          placeholder="https://steamcommunity.com/id/yourname"
          class="field"
          :disabled="busy"
          @input="reset"
        />
        <p v-if="profile.trim() && !valid" class="mt-1 text-xs text-status-wishlist">
          Use a steamcommunity.com/id/… or /profiles/… link.
        </p>
      </div>

      <label class="flex items-center gap-2 text-sm">
        <input v-model="onlyPlayed" type="checkbox" :disabled="busy" /> Only games I have played
      </label>

      <div aria-live="polite" class="min-h-12 text-sm">
        <p v-if="error" class="rounded-lg bg-status-dropped/10 px-3 py-2 text-status-dropped" role="alert" data-testid="steam-error">
          {{ error }}
        </p>
        <p v-else-if="phase === 'fetching'" class="text-muted">Fetching your Steam library…</p>
        <p v-else-if="phase === 'matching'" class="text-muted" data-testid="steam-progress">
          Matching games… {{ progress.done }} / {{ progress.total }}
        </p>
        <div v-else-if="plan && result" class="rounded-lg bg-status-completed/10 px-3 py-2 text-status-completed" data-testid="steam-preview">
          <template v-if="plan.entries.length">
            Ready to import: {{ plural(plan.added) }} new<template v-if="plan.updated">, hours updated on {{ plural(plan.updated) }}</template>.
          </template>
          <template v-else>Nothing to import: your library already has these games and hours.</template>
          <details v-if="unmatchedList.length" class="text-status-wishlist" data-testid="steam-unmatched">
            <summary class="cursor-pointer">
              {{ plural(unmatchedList.length) }} could not be matched to a RAWG game and will be skipped.
            </summary>
            <ul class="mt-1 max-h-48 space-y-0.5 overflow-y-auto pl-4 text-xs text-slate-300">
              <li v-for="g in unmatchedList" :key="g.appId" class="flex justify-between gap-3">
                <span class="truncate">{{ g.name }}</span>
                <span v-if="g.hours" class="shrink-0 text-muted">{{ g.hours }} h</span>
              </li>
            </ul>
          </details>
          <details v-if="failedList.length" class="text-status-wishlist" data-testid="steam-failed">
            <summary class="cursor-pointer">
              {{ plural(failedList.length) }} could not be looked up (RAWG error); try again later.
            </summary>
            <ul class="mt-1 max-h-48 space-y-0.5 overflow-y-auto pl-4 text-xs text-slate-300">
              <li v-for="g in failedList" :key="g.appId" class="flex justify-between gap-3">
                <span class="truncate">{{ g.name }}</span>
                <span v-if="g.hours" class="shrink-0 text-muted">{{ g.hours }} h</span>
              </li>
            </ul>
          </details>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <button type="button" class="btn" @click="busy ? reset() : close()">{{ busy ? 'Stop' : 'Cancel' }}</button>
        <button v-if="phase !== 'ready'" type="submit" class="btn btn-primary" :disabled="!valid || busy" data-testid="steam-fetch">
          Fetch library
        </button>
        <button v-else type="button" class="btn btn-primary" :disabled="!plan?.entries.length" data-testid="steam-submit" @click="submit">
          Import{{ plan?.entries.length ? ` ${plural(plan.entries.length)}` : '' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
