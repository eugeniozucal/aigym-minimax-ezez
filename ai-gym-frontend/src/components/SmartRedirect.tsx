import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'

export function SmartRedirect() {
  const { user, loading } = useAuth()

  // Show loading while authentication is being determined
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

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If authenticated, redirect to training zone for now
  // TODO: Implement proper role-based routing later
  return <Navigate to="/training-zone" replace />
}
