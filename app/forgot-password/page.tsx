'use client'

import { useState } from 'react'
import { resetPasswordRequest } from '../../lib/services/auth'
import { Button } from '../../components/ui'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await resetPasswordRequest(email)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              S
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent you a password reset link to {email}
            </p>
          </div>

          <div className="mt-8 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-blue-600 hover:text-blue-500"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
            S
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        <div className="mt-8 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full justify-center"
              isLoading={loading}
            >
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6">
            <Link
              href="/login"
              className="block w-full text-center text-sm text-blue-600 hover:text-blue-500"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
