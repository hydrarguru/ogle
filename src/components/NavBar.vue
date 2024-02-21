<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <nav>
  <div class="navbar">
      <h1 class="navbar-brand">ogle</h1>
      <div class="navbar-item">
        <RouterLink to="/">Home</RouterLink>
      </div>
      <div class="navbar-item">
        <RouterLink to="/games">Games</RouterLink>
      </div>
  </div>
  </nav>
</template>

<style scoped>
  nav {
    background-color: var(--secondary-color);
    box-shadow: 0 10px 20px 0 rgba(0,0,0,.07);
    width: 100%;
  }
  .navbar {
    display: flex;
    justify-content: flex-start;
    color: #fff;
    font-size: 2rem;
  }
  .navbar-brand {
    padding-top: 1rem;
    padding-left: 1rem;
    margin-right: 1rem;
  }
  .navbar-item {
    color: #fff;
    font-size: 1.5rem;
    padding: 2rem;
  }
  .navbar-item a {
    color: #fff;
    text-decoration: none;
  }
  .navbar-item:hover {
    background-color: #2a2a2a;
    transition: all 500ms ease-in-out;
  }
</style>
