import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        // Change this from http://127.0.0.1:8000 to your live backend URL
        target: 'https://e-comm-caf1.onrender.com', 
        changeOrigin: true,
        secure: false,
      },
    },
  },
})