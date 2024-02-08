<script setup lang="ts">
import NavBar  from "../components/NavBar.vue";
</script>

<template>
  <NavBar />
  <main>
    <div>
      <p>Welcome to Oogle, the best place to find games!</p>
      <p>Click on the Games link to see our selection.</p>
    </div>
  </main>
</template>

<style scoped>
  main {
    margin-left: 2rem;
    margin-right: 2rem;
    display: flex;
    flex-direction: column;
  }
</style>
