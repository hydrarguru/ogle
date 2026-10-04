<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/16/solid'
import LibraryPanel from '@/components/LibraryPanel.vue'
import StateMessage from '@/components/StateMessage.vue'
import { getGame, getScreenshots } from '@/api/rawg'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePageTitle } from '@/composables/usePageTitle'
import { resizeImage, toGameRef } from '@/utils/game'

const props = defineProps<{ id: string }>()

const game = useAsyncData((signal) => getGame(props.id, signal), () => props.id)
// Screenshots are a nice-to-have: a failure here shouldn't break the page.
const screenshots = useAsyncData(
  (signal) => getScreenshots(props.id, signal).then((r) => r.results.slice(0, 6)).catch(() => []),
  () => props.id,
)

usePageTitle(() => game.data.value?.name)

const platforms = computed(() => game.data.value?.parent_platforms?.map((p) => p.platform.name) ?? [])
const names = (items?: { name: string }[]) => items?.map((i) => i.name).join(', ') || '—'

const details = computed(() => {
  const g = game.data.value
  if (!g) return []
  return [
    ['Release date', g.released ? new Date(g.released).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'TBA'],
    ['Developers', names(g.developers)],
    ['Publishers', names(g.publishers)],
    ['Genres', names(g.genres)],
    ['Age rating', g.esrb_rating?.name ?? '—'],
    ['Average playtime', g.playtime ? `${g.playtime} hours` : '—'],
  ]
})
</script>

<template>
  <main>
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <StateMessage v-if="game.error.value" tone="error" title="Couldn't load this game" :description="game.error.value.message">
        <button class="btn" @click="game.reload()">Try again</button>
        <RouterLink to="/games" class="btn">Back to browse</RouterLink>
      </StateMessage>

      <div v-else-if="!game.data.value" class="animate-pulse space-y-6" aria-busy="true" aria-label="Loading game">
        <div class="aspect-21/9 rounded-2xl bg-surface" />
        <div class="h-8 w-1/2 rounded bg-surface" />
      </div>

      <template v-else>
        <div class="relative mb-8 overflow-hidden rounded-3xl border border-border">
          <img
            v-if="game.data.value.background_image"
            :src="resizeImage(game.data.value.background_image, 1280)!"
            :alt="`${game.data.value.name} artwork`"
            class="aspect-21/9 min-h-64 w-full object-cover"
          />
          <div v-else class="aspect-21/9 min-h-64 bg-surface" />
          <div class="absolute inset-0 bg-linear-to-t from-bg via-bg/50 to-transparent" aria-hidden="true" />
          <div class="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <h1 class="text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">{{ game.data.value.name }}</h1>
            <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span
                v-if="game.data.value.metacritic"
                class="rounded-md border border-status-completed/60 px-2 py-0.5 font-bold text-status-completed"
                title="Metacritic score"
              >
                {{ game.data.value.metacritic }}
              </span>
              <span class="text-accent">★ {{ game.data.value.rating.toFixed(2) }}</span>
              <span class="text-muted">({{ game.data.value.ratings_count.toLocaleString() }} ratings)</span>
              <span v-for="p in platforms" :key="p" class="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">{{ p }}</span>
            </div>
          </div>
        </div>

        <div class="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div class="space-y-10">
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" class="mb-3 text-xl font-bold">About</h2>
              <p class="leading-relaxed whitespace-pre-line text-slate-300">
                {{ game.data.value.description_raw || 'No description available.' }}
              </p>
            </section>

            <section v-if="screenshots.data.value?.length" aria-labelledby="shots-heading">
              <h2 id="shots-heading" class="mb-3 text-xl font-bold">Screenshots</h2>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <a
                  v-for="shot in screenshots.data.value"
                  :key="shot.id"
                  :href="shot.image"
                  target="_blank"
                  rel="noopener"
                  class="block overflow-hidden rounded-xl border border-border"
                >
                  <img
                    :src="resizeImage(shot.image, 420)!"
                    :alt="`${game.data.value.name} screenshot`"
                    loading="lazy"
                    class="aspect-video w-full object-cover transition hover:scale-105"
                  />
                </a>
              </div>
            </section>

            <section aria-labelledby="details-heading">
              <h2 id="details-heading" class="mb-3 text-xl font-bold">Details</h2>
              <dl class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <div v-for="[label, value] in details" :key="label">
                  <dt class="text-xs font-semibold tracking-wide text-muted uppercase">{{ label }}</dt>
                  <dd class="mt-0.5">{{ value }}</dd>
                </div>
              </dl>
              <div v-if="game.data.value.tags?.length" class="mt-6 flex flex-wrap gap-2">
                <span
                  v-for="tag in game.data.value.tags.slice(0, 15)"
                  :key="tag.id"
                  class="rounded-full border border-border px-2.5 py-1 text-xs text-muted"
                >
                  {{ tag.name }}
                </span>
              </div>
              <a
                v-if="game.data.value.website"
                :href="game.data.value.website"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-6 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                Official website <ArrowTopRightOnSquareIcon class="size-4" />
              </a>
            </section>
          </div>

          <aside class="lg:sticky lg:top-24 lg:self-start">
            <LibraryPanel :game="toGameRef(game.data.value)" />
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>
