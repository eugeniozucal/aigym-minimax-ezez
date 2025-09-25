import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useEffect, useRef } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireAuth?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false, requireAuth = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
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

  // For auth-required routes, check if user is authenticated
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to login if no user is authenticated (legacy behavior)
  if (!requireAuth && !requireAdmin && !user) {
    return <Navigate to="/login" replace />
  }

  // For admin-required routes, for now just require authentication
  // TODO: Implement proper admin checking later
  if (requireAdmin && !user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}