'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, CompanyRole } from '../types'
import { signIn, signUp, signOut, getCurrentUser } from '../services/auth'
import { createClient as createBrowserClient } from '../supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, role?: CompanyRole) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserClient()

    getCurrentUser().then(user => {
      setUser(user)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const user = await getCurrentUser()
          setUser(user)
        } else {
          setUser(null)
        }
      })()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await signIn(email, password)
      if (result.error) {
        return { error: result.error }
      }
      if (result.user) {
        setUser(result.user)
        router.push('/roster')
      }
      return { error: null }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (email: string, password: string, fullName: string, role: CompanyRole = CompanyRole.STAFF) => {
    setIsLoading(true)
    try {
      const result = await signUp(email, password, fullName, role)
      if (result.error) {
        return { error: result.error }
      }
      if (result.user) {
        setUser(result.user)
        router.push('/roster')
      }
      return { error: null }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, signIn: handleSignIn, signUp: handleSignUp, logout: handleLogout, isLoading }}>
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
