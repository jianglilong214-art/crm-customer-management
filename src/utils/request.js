import axios from 'axios'
import { getToken, removeToken, removeUser } from './auth'
import { ElMessage } from 'element-plus'
import router from '../router'

const isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()

const request = axios.create({
  baseURL: isNative ? 'https://crm-system-c3f.pages.dev/api' : '/api',
  timeout: 15000
})

request.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 401) {
      removeToken()
      removeUser()
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
      return Promise.reject(new Error('Unauthorized'))
    }
    return res
  },
  error => {
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
