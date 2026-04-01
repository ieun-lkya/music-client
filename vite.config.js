import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', 
        changeOrigin: true,
        // 🚀 极其致命的一行代码：在发给后端前，自动把路径里的 /api 抹掉！
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})