import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "./",  // Fixes loading issues in some cases
  plugins: [react()],
});
