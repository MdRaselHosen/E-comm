import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
    }
  }, [user])

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('access_token', data.access)
    setUser(data.user)
    return data
  }

  const register = async (email, password, confirm_password) => {
    const { data } = await authApi.register({ email, password, confirm_password })
    return data
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('cart')
  }

  const isStaff = !!user?.is_staff
  const isSuperuser = !!user?.is_superuser

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      isStaff,
      isSuperuser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
