import axios from 'axios'

const api = axios.create({
  // Looks for VITE_API_URL, falls back to relative path if not defined
  baseURL: import.meta.env.VITE_API_URL || '/api', 
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
