<script setup lang="ts">
import HeroSection from '../components/HeroSection.vue'

</script>

<template>
  <main>
    <HeroSection
      backgroundColor="#151515" 
      elementAlignment="center"
      sectionTitle="Extensive library of games to browse."
      sectionText="Browse our extensive library of 500,000+ games to find your next game."
    />
    <HeroSection
      backgroundColor="#202020"
      elementAlignment="center"
      sectionTitle="Personalized collections"
      sectionText="Create collections of your favorite games to share with friends or save for later."
    />
    <HeroSection
      backgroundColor="#151515"
      elementAlignment="center"
      sectionTitle="Accounts & Community"
      sectionText="Create an account to join our community and start sharing your collections."
    />
  </main>
</template>

<style scoped>
  main {
    display: flex;
    flex-direction: column;
  }
</style>
