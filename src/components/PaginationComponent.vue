<script setup lang="ts">

</script>

<template>
    <div class="wrapper">
        <button>1</button>
        <button>2</button>
        <button>3</button>
    </div>
</template>

<style scoped>
    .wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 2rem;
        margin-bottom: 2rem;
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
</style>