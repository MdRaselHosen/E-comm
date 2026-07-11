import api from './client'

export const authApi = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
}

export const productsApi = {
  list: () => api.get('/products/'),
  get: (id) => api.get(`/products/${id}/`),
}

export const ordersApi = {
  list: () => api.get('/orders/'),
  get: (id) => api.get(`/orders/${id}/`),
  create: (data) => api.post('/orders/', data),
  addItem: (orderId, data) => api.post(`/orders/${orderId}/add_item/`, data),
}

export const paymentsApi = {
  initialize: (data) => api.post('/payments/initialize/', data),
  confirm: (data) => api.post('/payments/confirm/', data),
  status: (data) => api.post('/payments/status/', data),
}
