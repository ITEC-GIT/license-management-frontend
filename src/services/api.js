import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://cobalt.pulsar.ao:5557'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = (username, password) => 
  api.post('/api/auth/login', { username, password })

export const getCurrentUser = () => 
  api.get('/api/auth/me')

// Licenses
export const getLicenses = (params) => 
  api.get('/api/licenses', { params })

export const getLicense = (id) => 
  api.get(`/api/licenses/${id}`)

export const generateLicense = (data) => 
  api.post('/api/licenses', data)

export const updateLicense = (id, data) => 
  api.put(`/api/licenses/${id}`, data)

export const deleteLicense = (id) => 
  api.delete(`/api/licenses/${id}`)

export const revokeLicense = (id, reason) => 
  api.post(`/api/licenses/${id}/revoke`, { reason })

export const downloadLicense = (id) => 
  api.get(`/api/licenses/${id}/download`, { responseType: 'blob' })

export const verifyLicense = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/licenses/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getVisibleTabs = () =>
  api.get('/api/visible-tabs', {
    headers: { Accept: 'application/json' }
  })

// Packages
export const getPackages = () =>
  api.get('/api/packages', {
    headers: { Accept: 'application/json' }
  })

export const updatePackageTabs = (id, tabIds) =>
  api.post(
    `/api/packages/${id}/tabs`,
    { tab_ids: tabIds },
    {
      headers: { Accept: 'application/json' }
    }
  )

// Customers
export const getCustomers = (params) => 
  api.get('/api/customers', { params })

export const getCustomer = (id) => 
  api.get(`/api/customers/${id}`)

export const createCustomer = (data) => 
  api.post('/api/customers', data)

export const updateCustomer = (id, data) => 
  api.put(`/api/customers/${id}`, data)

export const deleteCustomer = (id) => 
  api.delete(`/api/customers/${id}`)

// Dashboard
export const getDashboardStats = () => 
  api.get('/api/dashboard/stats')

export const getRecentActivity = () => 
  api.get('/api/dashboard/recent')

export default api
