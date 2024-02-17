<script setup lang="ts">
import NavBar from '../components/NavBar.vue'
import router from '../router';
import { onMounted } from 'vue';
import { fetchGamesStore } from '../stores/gameStore';
import { ref } from 'vue';

const gameId = router.currentRoute.value.params.id.toString();
const gameStore = fetchGamesStore();
//const gameDetails = await gameStore.fetchGameDetails(gameId);



onMounted(() => {
    
})

</script>

<template>
    <NavBar />
    <main>
        <div class="grid-container">
            <section class="container">
                <h1>Grand Theft Auto V</h1>
                <img src="https://via.placeholder.com/800x400" alt="Grand Theft Auto V">
                
            </section>
            <section class="container">
                <h1>Game Details</h1>
                <p>User ratings</p>
            </section>
            
            <section class="container">
                <h1>Game Details</h1>
                <p>User ratings</p>
            </section>
        </div>
    </main>
</template>

<style scoped>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .grid-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
    }
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;

        background-color: var(--secondary-color);
        box-shadow: 0 10px 20px 0 rgba(0,0,0,.07);
        border-radius: 6px;
        
        padding: 1em;
        margin: 1em;
    }
    .container * {
        margin: 0.5rem;
        padding: 0.25rem;
    }
    .container img {
        width: 100%;
        border-radius: 6px;
    }
</style>