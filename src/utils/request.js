import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const request = axios.create({
  // 🚀 核心改造：抛弃代理，全军出击！直接用真枪实弹的后端真实地址！
  baseURL: 'http://localhost:8080', 
  timeout: 60000
})

// 请求拦截器（保留你原来挂载 Token 的逻辑即可）
http.interceptors.request.use(
  config => {
    const token = localStorage.getItem('echo_token')
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  error => Promise.reject(error)
)

// 💥 响应拦截器：401 全局绞杀阵列
http.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code && res.code !== 200 && res.code !== 1) {
      ElMessage.error(res.msg || '服务器异常')
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    return res.data || res
  },
  error => {
    if (error.response) {
      if (error.response.status === 401) {
        ElMessage.error('登录状态已失效，请重新登录！');
        localStorage.removeItem('echo_user');
        localStorage.removeItem('echo_token'); 
        router.push('/login');
      } else {
        ElMessage.error(error.response.data?.msg || '网络繁忙，请稍后再试');
      }
    } else {
      ElMessage.error('服务器失联了，请检查网络！');
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