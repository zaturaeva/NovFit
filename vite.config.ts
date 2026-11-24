import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
 plugins: [vue(), vueDevTools()],
 server: { proxy: { '/api': 'http://localhost:3001', '/ws': { target: 'ws://localhost:3001', ws: true } } }
})
