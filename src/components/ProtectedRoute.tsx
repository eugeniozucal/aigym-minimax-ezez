import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useEffect, useRef } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, admin, loading } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Safety timeout to prevent infinite loading in ProtectedRoute
  useEffect(() => {
    if (loading) {
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.warn('ProtectedRoute: Loading timeout reached, check auth system')
        }
      }, 10000) // 10 second timeout
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [loading])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Show loading while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if no user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // For admin-required routes, check admin status
  if (requireAdmin) {
    // If admin is explicitly null (not undefined), user is not an admin
    if (admin === null) {
      // Redirect non-admin users to the user dashboard
      return <Navigate to="/user" replace />
    }
  }

  return <>{children}</>
}