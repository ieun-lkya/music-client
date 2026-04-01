import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api', 
  timeout: 60000
})

// 🚀 核心补丁 1：请求拦截器（出门自动往 Header 里塞 Token）
request.interceptors.request.use(config => {
  const token = localStorage.getItem('echo_token')
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token
  }
  return config
})

// 🚀 核心补丁 2：响应拦截器（抓捕后端返回的 401 越权错误）
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 200) return res.data 
    else {
      ElMessage.error(res.msg || '服务异常')
      return Promise.reject(new Error(res.msg || 'Error'))
    }
  },
  error => {
    console.error('网络请求异常:', error)
    // 🎯 如果后端发现你没 Token 或者 Token 假冒的，直接把你踢回登录页！
    if (error.response && error.response.status === 401) {
      ElMessage.error('登录已失效或越权访问，请重新登录！')
      localStorage.removeItem('echo_token')
      localStorage.removeItem('echo_user')
      
      // 🚀 极其关键：自动识别你的路由模式，确保绝对能跳进登录页！
      setTimeout(() => { 
          if (window.location.hash) {
              window.location.href = '/#/login' // 兼容 Hash 模式
          } else {
              window.location.href = '/login'   // 兼容 History 模式
          }
      }, 1000)
    } else {
      ElMessage.error('网络连接失败，请按 F12 查看报错')
    }
    return Promise.reject(error)
  }
)

const http = {
  get(url, params) { return request.get(url, { params: params?.params ? params.params : params }) },
  post(url, data, config = {}) { return request.post(url, data, config) },
  put(url, data, config = {}) { return request.put(url, data, config) },
  delete(url, params) { return request.delete(url, { params: params?.params ? params.params : params }) }
}

export default http