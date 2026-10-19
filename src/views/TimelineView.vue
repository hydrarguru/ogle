<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import StateMessage from '@/components/StateMessage.vue'
import { STATUS_META } from '@/constants/status'
import { usePageTitle } from '@/composables/usePageTitle'
import { useLibraryStore } from '@/stores/library'
import { LIBRARY_STATUSES, type LibraryStatus } from '@/types/library'
import { resizeImage } from '@/utils/game'
import { EVENT_LABELS } from '@/utils/statusHistory'
import { buildTimeline, DAY_MS, monthTicks } from '@/utils/timeline'

usePageTitle('Timeline')

/** Pixels per day for each zoom level. */
const ZOOMS = { years: 0.75, months: 3, weeks: 10 } as const
type Zoom = keyof typeof ZOOMS

const library = useLibraryStore()
const zoom = ref<Zoom>('months')
// Started, finished and dropped are the moments that tell a game's story; the rest is opt-in.
const visible = ref(new Set<LibraryStatus>(['playing', 'completed', 'dropped']))
const scroller = ref<HTMLElement>()

function toggle(status: LibraryStatus) {
  const next = new Set(visible.value)
  if (next.has(status)) next.delete(status)
  else next.add(status)
  visible.value = next
}

const now = Date.now()
const timeline = computed(() => buildTimeline(library.list, visible.value, now))
const width = computed(() => Math.max(1, Math.round(((timeline.value.end - timeline.value.start) / DAY_MS) * ZOOMS[zoom.value])))
const x = (at: number) => ((at - timeline.value.start) / DAY_MS) * ZOOMS[zoom.value]
const ticks = computed(() => monthTicks(timeline.value.start, timeline.value.end))
const todayX = computed(() => x(now))
/** Leaves room for the "Today" label, which sits just left of its line. */
const showTick = (tick: { at: number; isYear: boolean }) =>
  (tick.isYear || zoom.value !== 'years') && !(todayX.value - x(tick.at) >= 0 && todayX.value - x(tick.at) < 72)

const formatDate = (at: number) => new Date(at).toLocaleDateString(undefined, { dateStyle: 'medium' })

// Open on the most recent activity, at the right-hand end.
watch(
  [() => timeline.value.rows.length > 0, zoom],
  async () => {
    await nextTick()
    if (scroller.value) scroller.value.scrollLeft = scroller.value.scrollWidth
  },
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold tracking-tight">Timeline</h1>
      <p class="mt-1 text-sm text-muted">
        When you started, finished or dropped each game. Change the dates from a game's page.
      </p>
    </div>

    <StateMessage
      v-if="library.loaded && !library.count"
      title="Nothing to show yet"
      description="Add games to your library and change their status; each change is placed on the timeline."
    >
      <RouterLink to="/games" class="btn btn-primary">Browse games</RouterLink>
    </StateMessage>

    <template v-else-if="library.loaded">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2" role="group" aria-label="Events to show">
          <button
            v-for="s in LIBRARY_STATUSES"
            :key="s"
            type="button"
            class="btn !px-3 !py-1.5"
            :class="visible.has(s) ? [STATUS_META[s].badge, '!border-current'] : 'text-muted'"
            :aria-pressed="visible.has(s)"
            @click="toggle(s)"
          >
            <span class="size-2 rounded-full" :class="STATUS_META[s].dot" aria-hidden="true" />
            {{ EVENT_LABELS[s] }}
          </button>
        </div>
        <div class="flex rounded-lg border border-border bg-surface-2 p-0.5" role="group" aria-label="Zoom">
          <button
            v-for="(_, z) in ZOOMS"
            :key="z"
            type="button"
            class="cursor-pointer rounded-md px-3 py-1 text-sm font-medium capitalize transition"
            :class="zoom === z ? 'bg-accent text-bg' : 'text-muted hover:text-white'"
            :aria-pressed="zoom === z"
            @click="zoom = z"
          >
            {{ z }}
          </button>
        </div>
      </div>

      <StateMessage
        v-if="!timeline.rows.length"
        title="No events to show"
        description="Turn on more event types above."
      />

      <div v-else ref="scroller" class="overflow-x-auto rounded-2xl border border-border bg-surface">
        <div class="relative min-w-full" :style="{ width: `calc(var(--label-w) + ${width}px)` }" style="--label-w: 11rem">
          <!-- Month grid and today line, behind the rows. -->
          <div class="pointer-events-none absolute inset-y-0" style="left: var(--label-w)" aria-hidden="true">
            <div
              v-for="tick in ticks"
              :key="tick.at"
              class="absolute inset-y-0 border-l"
              :class="tick.isYear ? 'border-muted/40' : 'border-border/60'"
              :style="{ left: `${x(tick.at)}px` }"
            />
            <div class="absolute inset-y-0 border-l-2 border-dashed border-accent/60" :style="{ left: `${todayX}px` }" />
          </div>

          <div class="flex h-10 border-b border-border">
            <div
              class="sticky left-0 z-20 flex shrink-0 items-center bg-surface px-4 text-xs font-semibold tracking-wide text-muted uppercase"
              style="width: var(--label-w)"
            >
              Game
            </div>
            <div class="relative h-full" :style="{ width: `${width}px` }" aria-hidden="true">
              <template v-for="tick in ticks" :key="tick.at">
                <span
                  v-if="showTick(tick)"
                  class="absolute top-1/2 -translate-y-1/2 pl-1.5 text-xs whitespace-nowrap"
                  :class="tick.isYear ? 'font-bold text-slate-200' : 'text-muted'"
                  :style="{ left: `${x(tick.at)}px` }"
                >
                  {{ tick.label }}
                </span>
              </template>
              <span
                class="absolute top-1/2 -translate-x-full -translate-y-1/2 pr-1.5 text-xs font-semibold text-accent"
                :style="{ left: `${todayX}px` }"
              >
                Today
              </span>
            </div>
          </div>

          <ul>
            <li
              v-for="row in timeline.rows"
              :key="row.entry.id"
              class="group flex h-12 border-b border-border/60 last:border-b-0"
            >
              <RouterLink
                :to="{ name: 'game', params: { id: row.entry.id } }"
                class="sticky left-0 z-20 flex shrink-0 items-center gap-2 bg-surface px-4 text-sm font-medium group-hover:bg-surface-2"
                style="width: var(--label-w)"
                :title="row.entry.name"
              >
                <img
                  v-if="row.entry.image"
                  :src="resizeImage(row.entry.image, 420) ?? undefined"
                  alt=""
                  loading="lazy"
                  class="size-7 shrink-0 rounded object-cover"
                />
                <span class="truncate">{{ row.entry.name }}</span>
              </RouterLink>

              <div class="relative h-full group-hover:bg-white/[0.02]" :style="{ width: `${width}px` }">
                <div
                  v-for="seg in row.segments"
                  :key="`${seg.status}-${seg.start}`"
                  class="absolute top-1/2 -translate-y-1/2 rounded-full"
                  :class="[STATUS_META[seg.status].dot, seg.kind === 'active' ? 'h-2 opacity-70' : 'h-0.5 opacity-40']"
                  :style="{ left: `${x(seg.start)}px`, width: `${Math.max(2, x(seg.end) - x(seg.start))}px` }"
                  aria-hidden="true"
                />
                <span
                  v-for="(event, i) in row.events"
                  :key="`${event.status}-${event.at}-${i}`"
                  role="img"
                  class="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface transition hover:scale-150"
                  :class="STATUS_META[event.status].dot"
                  :style="{ left: `${x(event.at)}px` }"
                  :title="`${EVENT_LABELS[event.status]} · ${formatDate(event.at)}`"
                  :aria-label="`${row.entry.name}: ${EVENT_LABELS[event.status]} on ${formatDate(event.at)}`"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </main>
</template>
