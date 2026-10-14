import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Libraries that every visit loads and that rarely change get their own
// chunks: a new deploy then only invalidates the app code, and phones keep
// the cached libraries. Recharts is left alone because it already ships in
// a lazy chunk used only by the pages with charts.
const VENDOR_CHUNKS: [name: string, pattern: RegExp][] = [
  ['supabase', /[\\/]node_modules[\\/]@supabase[\\/]/],
  ['react', /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/],
  ['forms', /[\\/]node_modules[\\/]react-hook-form[\\/]/],
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return VENDOR_CHUNKS.find(([, pattern]) => pattern.test(id))?.[0]
        },
      },
    },
  },
})
