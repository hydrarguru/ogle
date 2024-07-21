<script setup lang="ts">
import GameCard from "../components/GameCard.vue";
import { fetchGamesStore } from "../stores/gameStore";

const gameStore = fetchGamesStore();
const gameItems = await gameStore.fetchGames(1, 25);
</script>


<template>
  <main>
    <section class="games-container">
      <article v-for="game in gameItems" :key="game">
        <GameCard :gameId="game.id" :gameTitle="game.name" :gameImage="game.background_image" />
      </article>
    </section>
  </main>
</template>

<style scoped>
  main {
    margin-top: 2rem;
    margin-left: 2rem;
    margin-right: 2rem;
    display: flex;
    flex-direction: column;
  }
  .games-container {
    margin-top: 2rem;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-auto-rows: 1fr;
    grid-column-gap: 1rem;
    grid-row-gap: 1rem;
  }
</style>
