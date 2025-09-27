import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'

/**
 * Smart Redirect Component
 * Redirects authenticated users to appropriate dashboard based on their role
 * Redirects unauthenticated users to community login by default
 */
export function SmartRedirect() {
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
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/user/community'
    return <Navigate to={redirectPath} replace />
  }

  // If user is not authenticated, redirect to community login
  // Users can navigate to admin login manually if needed
  return <Navigate to="/login" replace />
}
