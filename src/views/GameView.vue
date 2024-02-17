<script setup lang="ts">
import NavBar from '../components/NavBar.vue'
import router from '../router';
import { onMounted } from 'vue';
import { fetchGamesStore } from '../stores/gameStore';

const gameId = router.currentRoute.value.params.id;
const gameStore = fetchGamesStore();
console.log(gameStore.fetchGameDetails('3498'));


onMounted(() => {
    console.log(gameId);
})

</script>

<template>
    <NavBar />
    <main>
        <h1>Game View</h1>
        <p>{{ $route.params.id }}</p>
    </main>
</template>

<style scoped>
</style>