import { createRouter, createWebHistory } from 'vue-router'

const HomeView = () => import('../views/HomeView.vue')
const LoginView = () => import('../views/LoginView.vue')
const AdminView = () => import('../views/AdminView.vue')
const ADMIN_TOKEN = 'super_admin_secret'

const hasValidAdminToken = () => localStorage.getItem('admin_token') === ADMIN_TOKEN

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/', 
      name: 'home', 
      component: HomeView 
    },
    { 
      path: '/login', 
      name: 'login', 
      component: LoginView 
    },
    { 
      path: '/admin', 
      name: 'admin', 
      component: AdminView 
    }
  ]
})

// 🛡️ 真正的路由保安 (Router Guard) 在这里！
router.beforeEach((to, from, next) => {
  // 1. 如果去的是后台 (/admin)，检查管理员令牌
  if (to.path.startsWith('/admin')) {
    if (!hasValidAdminToken()) {
      localStorage.removeItem('admin_token')
      return next({ path: '/login', query: { role: 'admin', redirect: to.fullPath } })
    }
  }
  
  // 2. 如果去的是前台首页 (/)，或者本来就是去登录页 (/login)，直接无条件放行！
  // 因为咱们的首页本来就允许不登录听歌，只有点红心收藏的时候才会触发登录。
  next()
})

export default router
