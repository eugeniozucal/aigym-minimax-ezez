import React, { useState, useEffect } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Eye, EyeOff, Users, RotateCcw } from 'lucide-react'
import { isValidEmail } from '@/lib/auth-utils'

/**
 * Community Login Component
 * Enhanced with session recovery and return URL handling
 */
export function CommunityLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { user, signIn, sessionExpired, clearSessionExpired } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  
  const returnUrl = searchParams.get('returnUrl')
  const isSessionRecovery = sessionExpired || returnUrl
  
  // Clear session expired flag when component mounts
  useEffect(() => {
    if (sessionExpired) {
      clearSessionExpired()
    }
  }, [sessionExpired, clearSessionExpired])
  
  // Redirect authenticated users based on their role
  if (user && !sessionExpired) {
    if (returnUrl) {
      return <Navigate to={decodeURIComponent(returnUrl)} replace />
    }
    
    if (user.role === 'community_user') {
      return <Navigate to="/user/community" replace />
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn(email, password)
      
      if (!result.success) {
        setError(result.error || 'Login failed')
      } else {
        // Success - redirect will be handled by useEffect above
        if (returnUrl) {
          setTimeout(() => {
            window.location.href = decodeURIComponent(returnUrl)
          }, 100)
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-600 rounded-xl flex items-center justify-center mb-4">
            {isSessionRecovery ? (
              <RotateCcw className="h-8 w-8 text-white" />
            ) : (
              <Users className="h-8 w-8 text-white" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">AI GYM Community</h2>
          {isSessionRecovery ? (
            <>
              <p className="mt-2 text-gray-600">Session Recovery</p>
              <p className="text-sm text-orange-600 mt-1">Please sign in again to continue</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-gray-600">Member Access Portal</p>
              <p className="text-sm text-green-600 mt-1">Community Members Login</p>
            </>
          )}
        </div>
        
        {isSessionRecovery && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <RotateCcw className="h-5 w-5 text-orange-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-800">Session Recovered</p>
                <p className="text-xs text-orange-600 mt-1">
                  Your session expired. Please sign in again to continue where you left off.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Community Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="member@example.com"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isSessionRecovery ? 'Recovering session...' : 'Signing in...'}
                </>
              ) : (
                isSessionRecovery ? 'Continue Session' : 'Access Community'
              )}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-1">Demo Community Credentials:</p>
            <p className="text-xs text-gray-500">Email: dlocal@aiworkify.com</p>
            <p className="text-xs text-gray-500">Password: admin123</p>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Platform administrator?{' '}
              <a href="/admin/login" className="text-blue-600 hover:text-blue-500">
                Access Admin Portal
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}