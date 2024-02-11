<script lang="ts">
export default {
    setup() {
        return {
            searchInput: ''
        }
    },
    methods: {
        searchGames() {
            alert(this.searchInput);
        }
    }
}


</script>
<template>
    <div>
        <input @keyup.enter="searchGames()" v-model="searchInput" type="text" placeholder="Search for games"/>
    </div>
</template>


<style scoped>
    input {
        color: #4d4d4d;
        background-color: var(--secondary-color);
        font-size: 1.5rem;

        width: 100%;
        padding: 1rem;

        border: none;
        border-radius: 12px;
    }

    input:hover, input:focus {
        background-color: #f2f2f2;
        transition: all 500ms ease-in-out;
    }

</style>
