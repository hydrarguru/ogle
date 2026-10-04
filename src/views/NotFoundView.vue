<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StateMessage from '@/components/StateMessage.vue'
import { usePageTitle } from '@/composables/usePageTitle'

usePageTitle('Page not found')
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-20">
    <StateMessage title="Page not found" description="The page you're looking for doesn't exist.">
      <RouterLink to="/" class="btn btn-primary">Go home</RouterLink>
    </StateMessage>
  </main>
</template>
