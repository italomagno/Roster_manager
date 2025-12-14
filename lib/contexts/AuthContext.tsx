'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
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
  const supabase = useMemo(() => createBrowserClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // ✅ Função central: sincroniza user do seu app (public.users) a partir da sessão
  const syncUserFromSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      console.log(data, error)


      if (error) console.error('[AuthContext] getSession error:', error.message)

      const sessionUser = data.session?.user
      if (!sessionUser) {
        setUser(null)
        return
      }

      // Busca perfil em public.users (sua função atual)
      const profile = await getCurrentUser()
      setUser(profile)
    } catch (e) {
      console.error('[AuthContext] syncUserFromSession crash:', e)
      setUser(null)
    }
  }

  useEffect(() => {
    let unsub: (() => void) | undefined

    ;(async () => {
      setIsLoading(true)
      await syncUserFromSession()
      setIsLoading(false)

      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, _session) => {
        setIsLoading(true)
        await syncUserFromSession()
        setIsLoading(false)
      })

      unsub = () => sub.subscription.unsubscribe()
    })()

    return () => {
      if (unsub) unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await signIn(email, password)

      if (result.error) return { error: result.error }

      // ✅ garante que atualizou estado do contexto
      await syncUserFromSession()

      // se o profile não existir por algum motivo, não redireciona “cego”
      if (!user) {
        // tenta pegar direto de novo
        const profile = await getCurrentUser()
        setUser(profile)
      }

      router.push('/roster')
      return { error: null }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (
    email: string,
    password: string,
    fullName: string,
    role: CompanyRole = CompanyRole.STAFF
  ) => {
    setIsLoading(true)
    try {
      const result = await signUp(email, password, fullName, role)

      // ⚠️ Se confirmação de email estiver ligada, você NÃO terá sessão aqui
      if (result.error) return { error: result.error }

      // se o serviço retornar "check your email", não tenta logar
      if (!result.user) {
        // tenta sincronizar; se não houver sessão, vai ficar null mesmo
        await syncUserFromSession()
        return { error: null }
      }

      setUser(result.user)
      router.push('/roster')
      return { error: null }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut()
      setUser(null)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn: handleSignIn,
        signUp: handleSignUp,
        logout: handleLogout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
