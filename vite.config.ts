import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  build: {
    rolldownOptions: {
      input: {
        app: "./example/build/index.html"
      },
    }
  },
  server: {
    open: "./example/build/index.html"
  },
  test: {
    include: [
      "tests/**/*.test.ts"
    ],
    setupFiles: "tests/setup.ts"
  }
})
