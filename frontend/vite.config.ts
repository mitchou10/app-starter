import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  server: {
    // The page talks to the backend on its own origin: `/api` goes through.
    proxy: { '/api': { target: process.env.BACKEND_URL ?? 'http://localhost:8000' } },
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.test.ts', 'src/main.ts', 'src/vite-env.d.ts'],
    },
  },
})
