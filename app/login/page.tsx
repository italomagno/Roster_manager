'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/contexts/AuthContext'
import { CompanyRole } from '../../lib/types'
import { Button } from '../../components/ui'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { login, user, isLoading } = useAuth()
  const router = useRouter()
  const [loadingRole, setLoadingRole] = useState<CompanyRole | null>(null)

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/roster')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (user) return null

  const handleLogin = async (role: CompanyRole) => {
    setLoadingRole(role)
    try {
      await login(role)
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
            S
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to ShiftSync
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            MVP Demo Login (Choose a persona)
          </p>
        </div>
        <div className="mt-8 space-y-4 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <Button
            onClick={() => handleLogin(CompanyRole.MANAGER)}
            className="w-full justify-center"
            isLoading={loadingRole === CompanyRole.MANAGER}
          >
            Login as Manager
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
          <Button
            onClick={() => handleLogin(CompanyRole.STAFF)}
            variant="outline"
            className="w-full justify-center"
            isLoading={loadingRole === CompanyRole.STAFF}
          >
            Login as Employee
          </Button>
        </div>
        <p className="text-center text-xs text-gray-500">
          In a real app, this would support multi-tenant email/password auth.
        </p>
      </div>
    </div>
  )
}
