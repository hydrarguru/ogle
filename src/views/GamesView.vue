<script setup lang="ts">
import NavBar from '../components/NavBar.vue'
import Footer from '../components/Footer.vue'
import Card from '../components/Card.vue'
</script>

<template>
  <NavBar />
  <main class="container">
    <Card
      title="Shoes"
      description="The best shoes in the world"
      image="https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
      :tags="['shoes', 'fashion']"
      />
      <Card
      title="Shoes"
      description="The best shoes in the world"
      image="https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
      :tags="['shoes', 'fashion']"
      />
      <Card
      title="Shoes"
      description="The best shoes in the world"
      image="https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
      :tags="['shoes', 'fashion']"
      />
      <Card
      title="Shoes"
      description="The best shoes in the world"
      image="https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
      :tags="['shoes', 'fashion']"
      />
  </main>
  <Footer />
</template>

<style scoped>
  .container {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-around;
  }
  .container > * {
    margin: 1rem;
  }
</style>
