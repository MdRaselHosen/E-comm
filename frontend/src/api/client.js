import axios from 'axios'

// Extract the base domain from env or default to empty string for relative routing
const baseDomain = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  // This guarantees that regardless of environment, /api is always attached
  baseURL: `${baseDomain}/api`, 
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api