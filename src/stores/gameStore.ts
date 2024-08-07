import { defineStore } from 'pinia'

export const fetchGamesStore = defineStore('fetchGameStore', () => {
    async function fetchGames(page: number = 1, pageSize: number = 10) {
        try {
            const response = await fetch(`https://api.rawg.io/api/games?key=${import.meta.env.VITE_API_KEY}&page=${page}&page_size=${pageSize}`);
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchGameDetails(id: string) {
        const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${import.meta.env.VITE_API_KEY}`);
        const data = await response.json();
        return data;
    }

    return { fetchGames, fetchGameDetails }
})