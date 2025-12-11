'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, CompanyRole } from '../types'
import { mockLogin, mockLogout, verifySession } from '../services/auth'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  login: (role: CompanyRole) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('session_token='))
      ?.split('=')[1]

    if (token) {
      verifySession(token)
        .then(user => {
          if (user) {
            setUser(user)
          }
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (role: CompanyRole) => {
    setIsLoading(true)
    try {
      const { user, token } = await mockLogin('demo@example.com', role)
      setUser(user)

      // Set cookie
      const expires = new Date()
      expires.setDate(expires.getDate() + 7)
      document.cookie = `session_token=${token}; expires=${expires.toUTCString()}; path=/`

      router.push('/roster')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('session_token='))
      ?.split('=')[1]

    if (token) {
      await mockLogout(token)
    }

    setUser(null)
    document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
