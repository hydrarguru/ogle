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
    }

    .hero-text-container {
        text-align: center;
        padding: 2rem;
    }

    .hero-container h1 p {
        color: #ffffff;
    }
</style>