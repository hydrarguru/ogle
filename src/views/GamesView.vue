<script setup lang="ts">
import GameCard from "../components/GameCard.vue";
import PaginationComponent from "../components/PaginationComponent.vue";
import SearchBar from "../components/SearchBar.vue";
import { fetchGamesStore } from "../stores/gameStore";


const gameStore = fetchGamesStore();
const gameItems = await gameStore.fetchGames(1, 25);
</script>

<template>
  <main>
    <SearchBar :gameArray="gameItems"/>
    <div v-if="gameStore.isLoading">
      <p>Loading...</p>
    </div>
    <div class="games-container" v-else>
      <div v-for="game in gameItems" :key="game">
        <GameCard :gameId="game.id" :gameTitle="game.name" :gameImage="game.background_image" />
      </div>
    </div>
    <PaginationComponent :totalPages="10" />
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
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 2rem;
  }  
</style>
