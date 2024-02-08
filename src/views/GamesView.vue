<script setup lang="ts">
import NavBar  from "../components/NavBar.vue";
import GameCard from "../components/GameCard.vue";
import SearchBar from "../components/SearchBar.vue";
</script>

<template>
  <NavBar />
  <main>
    <SearchBar />
    <div class="games-container">
      <GameCard
        gameTitle="Cyberpunk 2077"
        gameDescription="Game Description"
        gameImage="https://placehold.co/250x350"
        gamePrice="19.99"
        gameRating="4.5"
      />
      <GameCard
        gameTitle="Hogwarts Legacy"
        gameDescription="Game Description"
        gameImage="https://placehold.co/250x350"
        gamePrice="19.99"
        gameRating="4.5"
      />
      <GameCard
        gameTitle="Elden Ring"
        gameDescription="Game Description"
        gameImage="https://placehold.co/250x350"
        gamePrice="19.99"
        gameRating="4.5"
      />
      <GameCard
        gameTitle="Cyberpunk 2077"
        gameDescription="Game Description"
        gameImage="https://placehold.co/250x350"
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
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
    margin-top: 2rem;
  }  
</style>
