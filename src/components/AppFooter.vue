<script setup lang="ts">
import { buildCommit } from '@/utils/buildInfo'
</script>

<template>
  <footer class="mt-16 border-t border-border py-8 text-center text-sm text-muted">
    <p>
      &copy; {{ new Date().getFullYear() }} ogle · Game data and images from
      <a href="https://rawg.io/" class="text-accent hover:underline" target="_blank" rel="noopener">RAWG</a>
    </p>
    <p class="mt-1">Your library is stored in this browser.</p>
    <p v-if="buildCommit" class="mt-1 text-xs" data-testid="build-commit">
      Build
      <a
        v-if="buildCommit.url"
        :href="buildCommit.url"
        class="font-mono text-slate-300 underline decoration-dotted underline-offset-2 hover:text-accent"
        target="_blank"
        rel="noopener"
        :title="`View commit ${buildCommit.full} on GitHub`"
      >
        {{ buildCommit.short }}
      </a>
      <span v-else class="font-mono text-slate-400" :title="buildCommit.full">{{ buildCommit.short }}</span>
    </p>
  </footer>
</template>
