import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { isAdminRoute, isCommunityRoute, requiresAuthentication } from '@/lib/auth-utils'

/**
 * Route middleware component that handles authentication and authorization
 * This component wraps the entire application to provide route-level security
 */
export function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname

  // Don't apply middleware while loading initial auth state
  if (loading) {
    return <>{children}</>
  }

  // Handle unauthenticated users
  if (!user) {
    // Allow public routes
    if (!requiresAuthentication(currentPath)) {
      return <>{children}</>
    }

    // Redirect to login for protected routes
    return <Navigate to="/login" state={{ from: currentPath }} replace />
  }

  // Handle authenticated users on public routes
  if (!requiresAuthentication(currentPath)) {
    // If on login page, redirect to appropriate dashboard
    if (currentPath === '/login') {
      const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/user/community'
      return <Navigate to={redirectTo} replace />
    }

    // If on root path, redirect to appropriate dashboard
    if (currentPath === '/') {
      const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/user/community'
      return <Navigate to={redirectTo} replace />
    }

    return <>{children}</>
  }

  // Handle role-based route access
  if (isAdminRoute(currentPath)) {
    // Admin routes - only admins allowed
    if (user.role !== 'admin') {
      return <Navigate to="/user/community" replace />
    }
  } else if (isCommunityRoute(currentPath)) {
    // Community routes - allow community users and admins
    if (user.role !== 'community_user' && user.role !== 'admin') {
      return <Navigate to="/login" replace />
    }
  }

  // If we reach here, access is allowed
  return <>{children}</>
}