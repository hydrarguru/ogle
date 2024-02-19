<script setup lang="ts">
import GameCard from "../components/GameCard.vue";
import SearchBar from "../components/SearchBar.vue";
import { fetchGamesStore } from "../stores/gameStore";


const gameStore = fetchGamesStore();
const gameItems = await gameStore.fetchGames();
</script>

<template>
  <main>
    <SearchBar />
    <!--
        <GameCard
        gameId="3498"
        gameTitle="Grand Theft Auto V"
        gameImage="https://placehold.co/250x350"
      />
    -->
    <div class="games-container">
      <div v-for="game in gameItems" :key="game">
        <GameCard :gameId="game.id" :gameTitle="game.name" :gameImage="game.background_image" />
      </div>
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
    align-items: flex-start;
    margin-top: 2rem;
  }  
</style>
