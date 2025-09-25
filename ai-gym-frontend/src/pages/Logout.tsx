import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LogOut } from 'lucide-react'

export function LogoutPage() {
  const navigate = useNavigate()
  const { signOut, loading } = useAuth()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut()
        // Redirect to login page after successful logout
        navigate('/login', { replace: true })
      } catch (error) {
        console.error('Logout error:', error)
        // Redirect anyway to prevent user from being stuck
        navigate('/login', { replace: true })
      }
    }

    performLogout()
  }, [signOut, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <LogOut className="h-12 w-12 text-blue-500 mx-auto" />
        </div>
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500 mt-3">Signing out...</p>
      </div>
    </div>
  )
}