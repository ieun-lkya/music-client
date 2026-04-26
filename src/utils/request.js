import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 60000
})

request.interceptors.request.use(
  (config) => {
    const isAdminRequest = String(config.url || '').startsWith('/admin')
    const adminToken = localStorage.getItem('admin_token')
    const token = localStorage.getItem('echo_token')

    if (isAdminRequest && adminToken && adminToken !== 'undefined' && adminToken !== 'null') {
      config.headers['X-Admin-Token'] = adminToken
    } else if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (payload?.code !== undefined && payload.code !== 200 && payload.code !== 1) {
      const message = payload.msg || '服务异常'
      ElMessage.error(message)
      return Promise.reject(new Error(message))
    }
    return payload
  },
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRequest = String(error.config?.url || '').startsWith('/admin')
      if (isAdminRequest) {
        ElMessage.error('管理员登录已失效，请重新登录')
        localStorage.removeItem('admin_token')
        router.push({ path: '/login', query: { role: 'admin' } })
      } else {
        ElMessage.error('登录状态已失效，请重新登录')
        localStorage.removeItem('echo_user')
        localStorage.removeItem('echo_token')
        router.push('/login')
      }
    } else if (error.response) {
      ElMessage.error(error.response.data?.msg || '网络繁忙，请稍后再试')
    } else {
      ElMessage.error('服务器连接失败，请检查网络')
    }
    return Promise.reject(error)
  }
)

const unwrap = (payload) => (payload?.data !== undefined ? payload.data : payload)

const normalizeGetConfig = (paramsOrConfig) => {
  if (!paramsOrConfig) {
    return undefined
  }
  if (paramsOrConfig.params || paramsOrConfig.headers || paramsOrConfig.timeout) {
    return paramsOrConfig
  }
  return { params: paramsOrConfig }
}

const http = {
  get(url, paramsOrConfig) {
    return request.get(url, normalizeGetConfig(paramsOrConfig)).then(unwrap)
  },
  post(url, data, config = {}) {
    return request.post(url, data, config).then(unwrap)
  },
  put(url, data, config = {}) {
    return request.put(url, data, config).then(unwrap)
  },
  delete(url, paramsOrConfig) {
    return request.delete(url, normalizeGetConfig(paramsOrConfig)).then(unwrap)
  }
}

export default http
