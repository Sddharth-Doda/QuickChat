import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target : 'https://quickchat-backend-n5r2.onrender.com',
        changeOrigin : true,
        secure : true
    },
  },
},
});

