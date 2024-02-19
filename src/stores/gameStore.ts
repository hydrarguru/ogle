import { ref } from 'vue'
import { defineStore } from 'pinia'

export const fetchGamesStore = defineStore('fetchGameStore', () => {
    const gamesList = ref([])

    async function fetchGames(page: number = 1, pageSize: number = 10) {
        const response = await fetch(`https://api.rawg.io/api/games?key=${import.meta.env.VITE_API_KEY}&page=${page}&page_size=${pageSize}`);
        const data = await response.json();
        return data.results;
    }

    async function fetchGameDetails(id: string) {
        const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${import.meta.env.VITE_API_KEY}`);
        const data = await response.json();
        return data;
    }

    return { gamesList, fetchGames, fetchGameDetails }
})