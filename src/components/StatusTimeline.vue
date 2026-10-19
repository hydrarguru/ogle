<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { STATUS_META } from '@/constants/status'
import type { LibraryEntry, LibraryStatus } from '@/types/library'
import { buildTimeline, timelineTicks, type TimelineMark } from '@/utils/statusHistory'

const props = withDefaults(
  defineProps<{
    entries: LibraryEntry[]
    /** Marks for these statuses are hidden; their spans still show. */
    hidden?: LibraryStatus[]
    /** How many times wider than the visible area the timeline is drawn. */
    zoom?: number
    now?: number
  }>(),
  { hidden: () => [], zoom: 1, now: () => Date.now() },
)

const DAY = 24 * 60 * 60 * 1000

const timeline = computed(() => buildTimeline(props.entries, props.now))

// Pad both ends so marks at the edges are not cut in half.
const range = computed(() => {
  const { start, end } = timeline.value
  const pad = Math.max(end - start, 30 * DAY) * 0.03
  return { start: start - pad, end: end + pad }
})

const percent = (time: number) => ((time - range.value.start) / (range.value.end - range.value.start)) * 100

const ticks = computed(() => timelineTicks(range.value.start, range.value.end, 18 * props.zoom))

// Near the edges the tooltip hangs inwards so the scroll area does not cut it off.
const tooltipAlign = (time: number) => {
  const at = percent(time) * props.zoom
  if (at < 12) return '-left-1'
  if (at > props.zoom * 100 - 12) return '-right-1'
  return 'left-1/2 -translate-x-1/2'
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
const describe = (entry: LibraryEntry, mark: TimelineMark) => `${entry.name}: ${STATUS_META[mark.status].event} ${formatDate(mark.at)}`
</script>

<template>
  <div class="flex overflow-hidden rounded-2xl border border-border bg-surface">
    <!-- Game names stay put while the timeline scrolls sideways. -->
    <ul class="w-36 shrink-0 border-r border-border sm:w-52" aria-label="Games">
      <li class="h-9 border-b border-border" aria-hidden="true" />
      <li v-for="row in timeline.rows" :key="row.entry.id" class="flex h-11 items-center px-3">
        <RouterLink
          :to="{ name: 'game', params: { id: row.entry.id } }"
          class="truncate text-sm font-medium hover:text-accent"
          :title="row.entry.name"
        >
          {{ row.entry.name }}
        </RouterLink>
      </li>
    </ul>

    <div class="min-w-0 flex-1 overflow-x-auto" data-testid="timeline-scroll">
      <div class="relative" :style="{ width: `${zoom * 100}%`, minWidth: '32rem' }">
        <div class="relative h-9 border-b border-border" aria-hidden="true">
          <span
            v-for="tick in ticks"
            :key="tick.time"
            class="absolute top-0 flex h-full items-end pb-1.5 pl-1 text-xs whitespace-nowrap"
            :class="tick.major ? 'font-semibold text-slate-200' : 'text-muted'"
            :style="{ left: `${percent(tick.time)}%` }"
          >
            {{ tick.label }}
          </span>
        </div>

        <!-- Grid lines and today marker span every row. -->
        <div class="pointer-events-none absolute inset-x-0 top-9 bottom-0" aria-hidden="true">
          <span
            v-for="tick in ticks"
            :key="tick.time"
            class="absolute inset-y-0 border-l"
            :class="tick.major ? 'border-border' : 'border-border/40'"
            :style="{ left: `${percent(tick.time)}%` }"
          />
          <span class="absolute inset-y-0 border-l border-dashed border-accent/60" :style="{ left: `${percent(now)}%` }" />
        </div>

        <ol class="relative">
          <li v-for="row in timeline.rows" :key="row.entry.id" class="relative h-11" :aria-label="row.entry.name">
            <span
              v-for="(segment, i) in row.segments"
              :key="i"
              class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full opacity-35"
              :class="STATUS_META[segment.status].dot"
              :style="{ left: `${percent(segment.start)}%`, width: `${percent(segment.end) - percent(segment.start)}%` }"
              aria-hidden="true"
            />
            <template v-for="(mark, i) in row.marks" :key="i">
              <span
                v-if="!hidden.includes(mark.status)"
                class="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 focus-visible:z-20 hover:z-20"
                :style="{ left: `${percent(mark.time)}%` }"
                tabindex="0"
                role="img"
                :aria-label="describe(row.entry, mark)"
                data-testid="timeline-mark"
              >
                <span
                  class="block size-3.5 rounded-full ring-2 ring-surface transition group-hover:scale-125 group-focus-visible:scale-125"
                  :class="STATUS_META[mark.status].dot"
                />
                <span
                  class="pointer-events-none absolute bottom-full mb-2 hidden rounded-md border border-border bg-surface-2 px-2 py-1 text-xs whitespace-nowrap shadow-lg group-hover:block group-focus-visible:block"
                  :class="tooltipAlign(mark.time)"
                >
                  <span class="font-semibold" :class="STATUS_META[mark.status].text">
                    {{ STATUS_META[mark.status].event }}
                  </span>
                  · {{ formatDate(mark.at) }}
                </span>
              </span>
            </template>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>
