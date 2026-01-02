    import axios from 'axios'

const request = axios.create({
  baseURL: '/api',   // 配合 Vite 反向代理
  timeout: 60000
})

/* 请求拦截器 */
request.interceptors.request.use(
  (config) => {
    // 示例：自动带 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* 响应拦截器 */
request.interceptors.response.use(
  (response) => {
    // 假设后端统一返回 { code, data, message }
    const res = response.data
    if (res.code !== 0) {
      return Promise.reject(res.message || '请求失败')
    }
    return res.data
  },
  (error) => {
    console.error('接口错误', error)
    return Promise.reject(error)
  }
)

export default request
