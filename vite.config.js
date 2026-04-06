import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 💥 核心修复：注入 Vue 3.4+ 要求的全局编译宏，彻底镇压控制台黄字警告！
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  // 🚀 调试优化：启用 Source Map 让断点更精准
  build: {
    sourcemap: true
  }
})