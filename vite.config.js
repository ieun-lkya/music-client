import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 🚀 极其致命的一步：补上 resolve.alias 别名配置！让 Vite 认识 '@'！
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', 
        changeOrigin: true,
        // 🚀 在发给后端前，自动把路径里的 /api 抹掉
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})