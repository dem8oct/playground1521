import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Reduce HMR overhead
    hmr: {
      overlay: true,
    },
    // Watch options to reduce CPU usage
    watch: {
      // Ignore node_modules to reduce file watching
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },
  build: {
    // Reduce source map overhead in dev
    sourcemap: false,
  },
})
