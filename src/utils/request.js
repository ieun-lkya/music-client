import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const request = axios.create({
  baseURL: 'http://localhost:8080', 
  timeout: 60000
})

// 🚀 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('echo_token')
    // 💥 致命防线：坚决拦截 "undefined" 和 "null" 字符串进入后端的 JWT 解析器！
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => Promise.reject(error)
)

// 💥 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    // 拦截业务逻辑错误
    if (res.code && res.code !== 200 && res.code !== 1) {
      ElMessage.error(res.msg || '服务器异常')
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    
    // 🚀 极其致命的修复：必须把外层的 Result 壳剥掉！
    // 确保组件拿到的是纯正的数组或对象，这样 .some(), .filter() 等数组方法才能正常工作！
    return res.data !== undefined ? res.data : res
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