<script setup lang="ts">
import NavBar  from "../components/NavBar.vue";
import GameCard from "../components/GameCard.vue";
</script>

<template>
  <NavBar />
  <main>
    <h1>Games</h1>
    <div class="games-container">
      <GameCard
        gameTitle="Cyberpunk 2077"
        gameDescription="Game Description"
        gameImage="https://via.placeholder.com/250"
        gamePrice="19.99"
        gameRating="4.5"
      />
      <GameCard
        gameTitle="Cyber"
        gameDescription="Game Description"
        gameImage="https://via.placeholder.com/250"
        gamePrice="19.99"
        gameRating="4.5"
      />
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
  .games-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
</style>
