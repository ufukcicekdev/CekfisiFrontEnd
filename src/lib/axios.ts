'use client'

import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const instance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token'ı sadece client-side'da ekle
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token')
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
}

// Request interceptor
instance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // URL'de api/v1'in tekrar etmediğinden emin ol
    if (config.url?.startsWith('/api/v1')) {
      config.url = config.url.replace('/api/v1', '')
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_URL}/api/v1/auth/token/refresh/`, {
          refresh: refreshToken
        })

        const { access } = response.data
        localStorage.setItem('token', access)
        
        instance.defaults.headers.common['Authorization'] = `Bearer ${access}`
        originalRequest.headers.Authorization = `Bearer ${access}`
        
        return instance(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default instance 