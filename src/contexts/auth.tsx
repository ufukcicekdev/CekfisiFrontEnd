'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import axios from '@/lib/axios'
import { useRouter } from 'next/navigation'
import { getAuthToken, setAuthToken, removeAuthToken } from '@/utils/auth'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string
  user_type: string
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isLoading: boolean
  login: (email: string, password: string, userType: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken()
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await axios.get('/users/me/')
          setUser(response.data)
        } catch (error) {
          console.error('Auth check error:', error)
          removeAuthToken()
          delete axios.defaults.headers.common['Authorization']
          setUser(null)
          router.push('/auth/login')
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [router])

  const login = async (email: string, password: string, userType: string) => {
    try {
      const response = await axios.post('/auth/login/', {
        email,
        password,
        user_type: userType
      })

      const { access, refresh, user: userData } = response.data
      
      setAuthToken(access)
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      
      setUser(userData)
      
      await router.push('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    removeAuthToken()
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/auth/login')
  }

  if (isLoading && getAuthToken()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 