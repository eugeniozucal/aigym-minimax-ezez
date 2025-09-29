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
  const { user, loading } = useAuth()
  const location = useLocation()

  // Simple loading state
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

  // Redirect to login if not authenticated
  if (!user) {
    const loginPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/login'
    return <Navigate to={loginPath} replace />
  }

  // Role-based access control
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/user/community'
    return <Navigate to={redirectTo} replace />
  }

  // Admin route protection - simple check
  if (location.pathname.startsWith('/admin') && user.role !== 'admin') {
    return <Navigate to="/user/community" replace />
  }

  // Grant access
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