<script setup lang="ts">
defineProps({
    backgroundColor: {
        type: String
    },
    elementAlignment: {
        type: String
    },
    sectionTitle: {
        type: String,
        default: 'Section Title'
    },
    sectionText: {
        type: String,
        default: 'Section Text'
    }
})

</script>

<template>
    <section class="hero-container" :style="{ backgroundColor: backgroundColor, alignItems: elementAlignment }">
        <div class="hero-text-container">
            <h1>{{ sectionTitle }}</h1>
            <p>{{ sectionText }}</p>
        </div>
        <aside>
            <img src="https://placehold.co/600x400" alt="Placeholder image" />
        </aside>
    </section>
</template>

<style scoped>
    .hero-container {
        display: flex;
        justify-content: space-between;
    }
    .hero-text-container {
        text-align: center;
        padding: 2rem;
        margin-left: 10rem;
    }
    .hero-container h1 p {
        color: #ffffff;
    }
    .hero-container aside {
        padding: 2rem;
        margin-right: 10rem;
        align-self: flex-end;
    }
</style>