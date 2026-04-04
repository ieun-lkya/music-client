<template>
  <div class="login-wrapper">
    <div class="login-glass-card">
      <div class="logo-area">
        <el-icon :size="40" color="#3b82f6"><MagicStick /></el-icon>
        <h2>EchoScene <span class="badge">AI</span></h2>
        <p class="subtitle">懂你的场景音乐大模型</p>
      </div>

      <el-tabs v-model="activeRole" class="role-tabs" stretch>
        <el-tab-pane label="🎧 听歌用户" name="user">
          <el-form :model="userForm" size="large" class="auth-form">
            <el-form-item>
              <el-input v-model="userForm.username" placeholder="请输入你的专属 ID" prefix-icon="User" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="userForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password @keyup.enter="handleUserAction" />
            </el-form-item>
            <el-form-item class="action-buttons">
              <el-button type="primary" class="main-btn" @click="handleUserAction" :loading="loading">
                {{ isRegisterMode ? '立 即 注 册' : '登 录 系 统' }}
              </el-button>
              <div class="toggle-text" @click="isRegisterMode = !isRegisterMode">
                {{ isRegisterMode ? '已有账号？去登录 ➔' : '没有账号？去注册 ➔' }}
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="⚙️ 系统管理员" name="admin">
          <el-form :model="adminForm" size="large" class="auth-form">
            <el-form-item>
              <el-input v-model="adminForm.username" placeholder="请输入管理员账号" prefix-icon="Monitor" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="adminForm.password" type="password" placeholder="请输入管理员密码" prefix-icon="Key" show-password @keyup.enter="handleAdminLogin" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" class="main-btn admin-btn" @click="handleAdminLogin" :loading="loading">
                进 入 控 制 台
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
// 🚀 极其关键：图标必须引入！
import { MagicStick, User, Lock, Monitor, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { loginAPI, registerAPI } from '../api/user'

// 🚀 1. 核心修复：引入我们的全局状态机引擎！
import { useMusicStore } from '../store/music' 

const router = useRouter()
const musicStore = useMusicStore() // 🚀 2. 实例化状态机
// 🚀 极其关键：被你误删的变量全找回来了！
const activeRole = ref('user') 
const isRegisterMode = ref(false)
const loading = ref(false)

const userForm = reactive({ username: '', password: '' })
const adminForm = reactive({ username: '', password: '' })

const handleUserAction = async () => {
  if (!userForm.username || !userForm.password) return ElMessage.warning('账号和密码不能为空哦')
  loading.value = true
  
  try {
    if (isRegisterMode.value) {
      const regRes = await registerAPI(userForm)
      if (regRes && regRes.code !== undefined && regRes.code !== 200) throw new Error(regRes.msg || '注册失败')
      ElMessage.success('🎉 注册成功！正在为您自动驶入首页...')
    }

    // 🚀 登录逻辑
    const loginRes = await loginAPI(userForm)
    if (!loginRes) throw new Error('登录失败')

    // 🚀 极其核心的解析剥壳：获取到后端的 {user: {}, token: ""}
    let realData = loginRes.data ? loginRes.data : loginRes

    if (!realData || !realData.user || !realData.token) {
      throw new Error('解析用户数据失败，后端未返回 Token！')
    }
    
    // 🚀 极其关键：存入大厂级别的 JWT 令牌
    localStorage.setItem('echo_token', realData.token)
    localStorage.setItem('echo_user', JSON.stringify(realData.user))
    
    // 💥 3. 极其致命的修复：瞬间唤醒内存里的全局状态机！不加这句就会显示未登录！
    musicStore.currentUser = realData.user
    
    if (!isRegisterMode.value) ElMessage.success(`欢迎回来，${realData.user.username}！`)

    router.push('/')
    
  } catch (error) {
    if (!error.message.includes('服务异常') && !error.message.includes('登录已失效')) {
       ElMessage.error(error.message || '操作失败，请检查账号密码')
    }
  } finally {
    loading.value = false
  }
}

const handleAdminLogin = () => {
  if (!adminForm.username || !adminForm.password) return ElMessage.warning('请输入管理员凭证')
  loading.value = true
  
  setTimeout(() => {
    if (adminForm.username === 'admin' && adminForm.password === '123456') {
      ElMessage.success('管理员身份核验通过')
      localStorage.setItem('admin_token', 'super_admin_secret')
      router.push('/admin') 
    } else {
      ElMessage.error('管理员账号或密码错误！')
    }
    loading.value = false
  }, 600)
}
</script>

<style scoped>
:global(body), :global(html), :global(#app) { margin: 0; padding: 0; height: 100%; }

.login-wrapper {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
}

@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.login-glass-card {
  width: 420px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.logo-area { text-align: center; margin-bottom: 30px; }
.logo-area h2 { margin: 10px 0 5px; font-size: 28px; color: #1f2937; }
.badge { font-size: 12px; background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 4px; vertical-align: super; }
.subtitle { color: #6b7280; font-size: 14px; margin: 0; }

.role-tabs :deep(.el-tabs__item) { font-size: 16px; font-weight: 600; }
.role-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; background-color: #e5e7eb; }

.auth-form { margin-top: 25px; }
.main-btn { width: 100%; border-radius: 8px; font-size: 16px; font-weight: bold; letter-spacing: 2px; }
.admin-btn { background-color: #1f2937; border-color: #1f2937; color: #fff; }
.admin-btn:hover { background-color: #374151; border-color: #374151; }

.action-buttons { display: flex; flex-direction: column; align-items: center; gap: 15px; margin-top: 30px; }
.toggle-text { color: #6b7280; font-size: 14px; cursor: pointer; transition: 0.3s; margin-top: 15px; text-align: center; width: 100%; }
.toggle-text:hover { color: #3b82f6; text-decoration: underline; }
</style>