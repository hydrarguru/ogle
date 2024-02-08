<script setup lang="ts">
import { PlusIcon, HeartIcon } from "@heroicons/vue/24/outline";
import { RouterLink } from "vue-router";
defineProps({
    gameId: Number,
    gameTitle: String,
    gameDescription: String,
    gameImage: String,
    gamePrice: String,
    gameRating: String,
    gameRatings: Array
})
</script>

<template>
    <div class="card">
        <img :src="gameImage" alt="Game Image" />
        <div class="card-body">
            <RouterLink :to="`/games/${gameId}`"><h2>{{ gameTitle }}</h2></RouterLink>
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
        box-shadow: 0 10px 20px 0 rgba(0,0,0,.07);
        border-radius: 12px;
    }
    .card img {
        width: 100%;
        object-fit: inherit;
    }

    .card-body {
        display: list-item;
        padding-left: 1rem;
    }
    .card-footer {
        display: flex;
        justify-content: flex-end;
        padding: 1rem;
    }
    .card-footer button {
        background-color: var(--primary-btn);
        border: none;
        border-radius: 0.25rem;
        margin: 0 0.25rem;
    }
    .card-footer button:hover {
        transition: all 300ms ease-in-out;
        background-color: var(--primary-btn-hover);
    }

    a {
        color: #ffffff;
        text-decoration: none;
    }

    a:hover {
        color: #ffffffc1;
        transition: all 300ms ease-in-out;
    }

    .icon {
        color: #ffffff;
        width: 36px;
        height: 36px;
        justify-content: center;
    }
    .icon:hover {
        transition: all 300ms ease-in-out;
        color: #000000
    }
</style>
