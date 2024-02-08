<script setup lang="ts">
    defineProps({
      title: String,
      description: String,
      image: String,
      tags: Array,
    })
</script>

<template>
  <div class="card w-96 bg-base-100 shadow-xl">
    <figure>
      <img
        src="https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
        alt="Shoes"
      />
    </figure>
    <div class="card-body">
      <h2 class="card-title">{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
  </div>
</template>
