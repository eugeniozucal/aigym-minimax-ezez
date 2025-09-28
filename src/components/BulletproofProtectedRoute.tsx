import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useEffect, useState } from 'react'
import { isAdminRoute, isCommunityRoute } from '@/lib/auth-utils'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'community_user')[]
}

/**
 * Session Expired Component
 * Provides user with clear recovery options
 */
function SessionExpiredMessage({ onRetryLogin }: { onRetryLogin: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h2>
        <p className="text-gray-600 mb-6">
          Your session has expired. Please sign in again to continue.
        </p>
        <div className="space-y-3">
          <button
            onClick={onRetryLogin}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In Again
          </button>
          <p className="text-sm text-gray-500">
            You will be redirected to the login page
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Bulletproof Protected Route Component
 * Provides robust route protection with session timeout recovery
 */
export function BulletproofProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, sessionExpired, validateRouteAccess, clearSessionExpired } = useAuth()
  const location = useLocation()
  const [accessValidation, setAccessValidation] = useState<{
    hasAccess: boolean
    redirectTo?: string
    checked: boolean
  }>({ hasAccess: false, redirectTo: undefined, checked: false })
  const [validationTimeout, setValidationTimeout] = useState(false)

  // Handle session expiration with recovery
  const handleSessionExpired = () => {
    clearSessionExpired()
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(location.pathname + location.search)
    window.location.href = `/login?returnUrl=${returnUrl}`
  }

  // Validate access when route or user changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    async function checkAccess() {
      if (loading) return

      // Reset validation timeout
      setValidationTimeout(false)
      
      // Set timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.warn('Route access validation timeout - defaulting to login redirect')
        setValidationTimeout(true)
        setAccessValidation({
          hasAccess: false,
          redirectTo: '/login',
          checked: true
        })
      }, 15000) // 15 second timeout

      if (!user) {
        clearTimeout(timeoutId)
        setAccessValidation({
          hasAccess: false,
          redirectTo: '/login',
          checked: true
        })
        return
      }

      try {
        const validation = await validateRouteAccess(location.pathname)
        clearTimeout(timeoutId)
        setAccessValidation({
          hasAccess: validation.hasAccess,
          redirectTo: validation.redirectTo,
          checked: true
        })
      } catch (error) {
        console.error('Error validating route access:', error)
        clearTimeout(timeoutId)
        setAccessValidation({
          hasAccess: false,
          redirectTo: '/login',
          checked: true
        })
      }
    }

    checkAccess()
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [user, loading, location.pathname, validateRouteAccess, clearSessionExpired])

  // Show session expired message if session has expired
  if (sessionExpired) {
    return <SessionExpiredMessage onRetryLogin={handleSessionExpired} />
  }

  // Show loading while authentication is being determined (with timeout protection)
  if ((loading || !accessValidation.checked) && !validationTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect if access validation failed
  if (!accessValidation.hasAccess && accessValidation.redirectTo) {
    return <Navigate to={accessValidation.redirectTo} replace />
  }

  // Additional role-based checks if allowedRoles is specified
  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role)) {
      // Determine appropriate redirect based on user role
      const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/user/community'
      return <Navigate to={redirectTo} replace />
    }
  }

  // If we reach here, access is granted
  return <>{children}</>
}

/**
 * Admin-only route wrapper
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <BulletproofProtectedRoute allowedRoles={['admin']}>
      {children}
    </BulletproofProtectedRoute>
  )
}

/**
 * Community-accessible route wrapper (allows community users and admins)
 */
export function CommunityRoute({ children }: { children: React.ReactNode }) {
  return (
    <BulletproofProtectedRoute allowedRoles={['community_user', 'admin']}>
      {children}
    </BulletproofProtectedRoute>
  )
}

/**
 * Public route that redirects authenticated users based on their role
 * Enhanced with session timeout handling
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionExpired, clearSessionExpired } = useAuth()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Timeout protection for loading state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Public route loading timeout - proceeding to render')
        setLoadingTimeout(true)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeoutId)
  }, [loading])

  // Clear session expired flag if we're on a public route
  useEffect(() => {
    if (sessionExpired) {
      clearSessionExpired()
    }
  }, [sessionExpired, clearSessionExpired])

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (user && !sessionExpired) {
    const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/user/community'
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}