import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { LoginUser } from '../types'
import router from '../router'
import { ElMessage } from 'element-plus'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true
})

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers['Content-Type'] = 'application/json;charset=UTF-8'
  return config
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res && res.code !== undefined && res.code !== 200) {
      if (res.code === 401) {
        localStorage.removeItem('loginUser')
        ElMessage.error(res.message || '登录已过期，请重新登录')
        router.push('/login')
        return Promise.reject(new Error(res.message || '未登录'))
      }
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('loginUser')
      ElMessage.error('登录已过期，请重新登录')
      router.push('/login')
    } else {
      ElMessage.error(error.message || '网络异常，请检查后端是否启动')
    }
    return Promise.reject(error)
  }
)

export function saveUser(user: LoginUser) {
  localStorage.setItem('loginUser', JSON.stringify(user))
}

export function getUser(): LoginUser | null {
  const raw = localStorage.getItem('loginUser')
  if (!raw) return null
  try {
    return JSON.parse(raw) as LoginUser
  } catch {
    return null
  }
}

export function clearUser() {
  localStorage.removeItem('loginUser')
}

export default request
