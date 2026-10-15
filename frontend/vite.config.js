import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Chuyển tiếp /api và /sanctum sang Laravel (php artisan serve) để cookie Sanctum dùng chung domain
const backend = 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port : 5173, strictPort: true, open: true, cors: true, hmr: true,
    proxy: {
      '/api': backend,
      '/sanctum': backend,
    },
  },
})
