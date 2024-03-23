<script lang="ts">

export default {
    setup() {
        return {
            searchInput: '',
        };
    },
    methods: {
    },
    props: {
        gameArray: Array
    },

}


</script>
<template>
    <div class="wrapper">
        <input v-model="searchInput" type="text" placeholder="Search for games"/>
        <button>Search</button>
    </div>
</template>


<style scoped>
    .wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    button {
        color: #4d4d4d;
        background-color: var(--secondary-color);
        font-size: 1.5rem;

        padding: 1rem;
        margin-left: 1rem;

        border: none;
        border-radius: 12px;
    }

    button:hover {
        background-color: #f2f2f2;
        transition: all 500ms ease-in-out;
    }

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

    .icon {
        color: #ffffff;
        width: 24px;
        height: 24px;
        justify-content: center;
    }
    button + .icon:hover {
        transition: all 300ms ease-in-out;
        color: #000000
    }
</style>
