<script setup lang="ts">
import { PlusIcon, HeartIcon } from "@heroicons/vue/24/outline";
import { RouterLink } from "vue-router";
defineProps({
    gameTitle: String,
    gameDescription: String,
    gameImage: String,
    gamePrice: String,
    gameRating: String,
})
</script>

<template>
    <div class="card">
        <img :src="gameImage" alt="Game Image" />
        <RouterLink to="/">
            <h2>{{ gameTitle }}</h2>
        </RouterLink>
        <div class="card-body">
            <p>{{ gameDescription }}</p>
            <p>Price: {{ gamePrice }}</p>
            <p>Rating: {{ gameRating }}</p>
        </div>
        <div class="card-footer">
            <button>
                <PlusIcon class="icon" />
            </button>
            <button>
                <HeartIcon class="icon" />
            </button>
        </div>
    </div>
</template>

<style scoped>
    .card {
        background-color: var(--secondary-color);
        border: 1px solid var(--accent);
        border-radius: 0.5rem;
    }
    .card-body {
        padding: 1rem;
    }
    .card-footer {
        display: flex;
        justify-content: space-between;
        padding: 1rem;
    }

    .icon {
        width: 36px;
        height: 36px;
    }
</style>
