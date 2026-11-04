<script setup lang="ts">
import { onMounted } from 'vue'
import { useCurrentUser } from './composables/useCurrentUser'

const { user, loaded, load, login, logout } = useCurrentUser()

onMounted(load)
</script>

<template>
  <main>
    <h1>App</h1>
    <p v-if="!loaded">...</p>
    <template v-else-if="user">
      <p>Signed in as {{ user.name || user.username || user.email }}</p>
      <button @click="logout">Sign out</button>
    </template>
    <button v-else @click="login()">Sign in</button>
  </main>
</template>
