<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import Footer from './components/FooterComponent.vue'
</script>

<template>
  <NavBar />
  <Suspense>
    <RouterView />
  </Suspense>
  <Footer />
</template>

<style scoped>
  
</style>
