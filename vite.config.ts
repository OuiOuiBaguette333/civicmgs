import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      //creates an endpoint at http://localhost:5173/abs-api
      '/abs-api': {
        target: 'https://api.data.abs.gov.au/rest',
        changeOrigin: true,
        secure: true,
        // removes '/abs-api' from the URL before sending it to the ABS
        rewrite: (path) => path.replace(/^\/abs-api/, ''),
      },
    },
  },
})