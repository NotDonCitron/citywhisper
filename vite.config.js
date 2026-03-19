import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    https: true,
    proxy: {
      '/pois': 'http://localhost:8000',
      '/route': 'http://localhost:8000',
      '/poi': 'http://localhost:8000',
      '/static': 'http://localhost:8000',
      '/proxy_image': 'http://localhost:8000',
      '/geofence': 'http://localhost:8000',
    },
  },
})
