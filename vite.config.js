import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/NeanderJs',
  build:{
    minify: false,
  },
  plugins: [vue()],
  resolve: {
    extensions: ['.vue', '.js'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  
})
