import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // <-- absolute root path for production builds
  plugins: [react()],
})

