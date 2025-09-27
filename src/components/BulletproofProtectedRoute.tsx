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
 * Bulletproof Protected Route Component
 * Provides robust route protection with explicit role-based access control
 */
export function BulletproofProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, validateRouteAccess } = useAuth()
  const location = useLocation()
  const [accessValidation, setAccessValidation] = useState<{
    hasAccess: boolean
    redirectTo?: string
    checked: boolean
  }>({ hasAccess: false, redirectTo: undefined, checked: false })

  // Validate access when route or user changes
  useEffect(() => {
    async function checkAccess() {
      if (loading) return

      if (!user) {
        setAccessValidation({
          hasAccess: false,
          redirectTo: '/login',
          checked: true
        })
        return
      }

      try {
        const validation = await validateRouteAccess(location.pathname)
        setAccessValidation({
          hasAccess: validation.hasAccess,
          redirectTo: validation.redirectTo,
          checked: true
        })
      } catch (error) {
        console.error('Error validating route access:', error)
        setAccessValidation({
          hasAccess: false,
          redirectTo: '/login',
          checked: true
        })
      }
    }

    checkAccess()
  }, [user, loading, location.pathname, validateRouteAccess])

  // Show loading while authentication is being determined
  if (loading || !accessValidation.checked) {
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
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
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
  if (user) {
    const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/user/community'
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}