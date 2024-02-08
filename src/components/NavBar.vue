<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <nav>
    <h1>ogle</h1>
    <ul>
      <li>
        <RouterLink to="/">Home</RouterLink>
      </li>
      <li>
        <RouterLink to="/games">Games</RouterLink>
      </li>
      <li>
        Account
      </li>
    </ul>
  </nav>
</template>

<style scoped>
  nav {
    background-color: #2e2e2e;
    border-radius: .25rem;
    border: 1px solid #FFD580;
    box-shadow: 8px 4px 4px rgba(0, 0, 0, 0.25);

    margin-top: 1rem;
    margin-left: 2rem;
    margin-right: 2rem;
    margin-bottom: 2rem;
    padding: 1rem;
  }

  nav h1 {
    font-size: 2rem;
    color: #FFD580;
    margin: 0;
  }

  ul {
    display: flex;
    justify-content: space-evenly;
    list-style: none;
  }

  a {
    color: #ffffff;
    text-decoration: none;
  }
  a:hover {
    color: #FFD580;
    text-decoration: underline #FFD580;
  }
</style>
