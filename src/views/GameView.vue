<script setup lang="ts">
import router from '../router';
import { fetchGamesStore } from '../stores/gameStore';

const gameId = router.currentRoute.value.params.id.toString();
const gameStore = fetchGamesStore();
const gameDetails = await gameStore.fetchGameDetails(gameId);

const gamePlatforms = gameDetails.parent_platforms.map((platform) => {
    return platform.platform.name;
}).join(', ');

const gameGenres = gameDetails.genres.map((genre) => {
    return genre.name;
}).join(', ');

const gameTags = gameDetails.tags.map((tag) => {
    return tag.name;
}).join(', ');


</script>

<template>
    <main>
        <section class="container">
            <h1>{{ gameDetails.name }}</h1>
            <img :src="gameDetails.background_image" alt="Grand Theft Auto V">
            
        </section>
        <div class="grid-container">
            <section class="container">
                <h1>Game Details</h1>
                <ol>
                    <li>Platform: {{ gamePlatforms }}</li>
                    <li>Release Date: {{ gameDetails.released }}</li>
                    <li>Developer: {{ gameDetails.developers[0].name }}</li>
                    <li>Publisher: {{ gameDetails.publishers[0].name }}</li>
                    <li>Genre: {{ gameGenres }}</li>
                    <li>Tags: {{ gameTags }}</li>
                </ol>
            </section>

            <section class="container">
                <h1>Game Ratings</h1>
                <ol>
                    <li>Metacritic: {{ gameDetails.metacritic }}</li>
                    <li>Community Rating: {{ gameDetails.rating }}/5</li>
                </ol>
            </section>

            <section class="container">
                <h1>Game Description</h1>
                <p>{{ gameDetails.description_raw }}</p>
            </section>
        </div>
    </main>
</template>

<style scoped>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-left: 2rem;
        margin-right: 2rem;
    }

    @media screen and (min-width: 600px){
        .grid-container {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        align-items: flex-start;
        margin-right: 2rem;
        margin-left: 2rem;
    }
    .container {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        background-color: var(--secondary-color);
        box-shadow: 0 10px 20px 0 rgba(0,0,0,.07);
        border-radius: 6px;
        
        padding: 1em;
        margin: 1em;
    }

    .container li {
        list-style-type: armenian;
        padding: 0;
        text-decoration: dotted;
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