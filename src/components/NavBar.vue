<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <nav>
    <div class="navbar bg-base-100">
      <div class="flex-1">
        <RouterLink to="/" class="btn btn-ghost text-xl">ogle</RouterLink>
      </div>
      <div class="flex-none">
        <ul class="menu menu-horizontal px-1">
          <li><a href="/games">Games</a></li>
          <li>
            <details>
              <summary>Account</summary>
              <ul class="p-2 bg-base-100 rounded-t-none">
                <li><a>Profile</a></li>
                <li><a>Library</a></li>
                <li><a>Logout</a></li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped></style>
