import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    transformer: 'postcss', // ⬅ dùng PostCSS, không dùng lightningcss native
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  server: {
    allowedHosts: ['dd4b55c264ef.ngrok-free.app'], // 👈 thêm dòng này
  },
})
