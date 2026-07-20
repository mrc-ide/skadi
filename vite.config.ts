import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  build: {
    rollupOptions: {
      input: {
        app: "./example/build/index.html"
      }
    }
  },
  server: {
    open: "./example/build/index.html"
  }
})
