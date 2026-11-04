<script setup lang="ts">
import { onMounted, ref } from 'vue'

const status = ref('...')

onMounted(async () => {
  try {
    const response = await fetch('/api/health')
    status.value = ((await response.json()) as { status: string }).status
  } catch {
    status.value = 'unreachable'
  }
})
</script>

<template>
  <main>
    <h1>App</h1>
    <p>Backend: {{ status }}</p>
  </main>
</template>
