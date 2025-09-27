import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService, type UserWithRole } from '@/lib/auth-service'
import { roleManagementService } from '@/lib/role-management'
import { AUTH_ERRORS } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: UserWithRole | null
  admin: any | null  // Backward compatibility - derived from user.role
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success?: boolean; error?: string; redirectTo?: string }>
  signOut: () => Promise<void>
  hasPermission: (permission: 'admin' | 'community_access' | 'role_management') => Promise<boolean>
  refreshUser: () => Promise<void>
  validateRouteAccess: (route: string) => Promise<{ hasAccess: boolean; redirectTo?: string; userRole?: string }>
  // Backward compatibility methods
  getUserType: () => 'admin' | 'community' | 'unknown'
  getPostLoginRoute: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Bulletproof Authentication Provider
 * Simplified, reliable authentication state management
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Load user on mount (one-time check)
  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      const userData = await authService.getAuthenticatedUser()
      setUser(userData)
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  // Initialize authentication state
  useEffect(() => {
    loadUser()

    // Set up auth listener - KEEP SIMPLE, avoid async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event)
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null)
          authService.clearCache()
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Refresh user data after sign in or token refresh
          try {
            const userData = await authService.getAuthenticatedUser()
            setUser(userData)
          } catch (error) {
            console.error('Error refreshing user data:', error)
            setUser(null)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await authService.signIn(email, password)
      
      if (result.success) {
        // The auth state change listener will handle updating the user state
        return result
      } else {
        return result
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        success: false,
        error: AUTH_ERRORS.UNEXPECTED_ERROR
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      await authService.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Check permissions
  const hasPermission = useCallback(async (permission: 'admin' | 'community_access' | 'role_management') => {
    return await roleManagementService.hasPermission(permission)
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getAuthenticatedUser()
      setUser(userData)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }, [])

  // Validate route access
  const validateRouteAccess = useCallback(async (route: string) => {
    return await roleManagementService.validateRouteAccess(route)
  }, [])

  // Backward compatibility: admin property (derived from user role)
  const admin = user?.role === 'admin' ? { id: user.id, ...user } : null

  // Backward compatibility: getUserType method
  const getUserType = useCallback((): 'admin' | 'community' | 'unknown' => {
    if (!user) return 'unknown'
    if (user.role === 'admin') return 'admin'
    if (user.role === 'community_user') return 'community'
    return 'unknown'
  }, [user])

  // Backward compatibility: getPostLoginRoute method
  const getPostLoginRoute = useCallback((): string => {
    const userType = getUserType()
    switch (userType) {
      case 'admin':
        return '/admin/dashboard'
      case 'community':
        return '/user/community'
      default:
        return '/admin/dashboard'
    }
  }, [getUserType])

  const contextValue = {
    user,
    admin,
    loading: loading && !initialized, // Only show loading during initial load
    signIn,
    signOut,
    hasPermission,
    refreshUser,
    validateRouteAccess,
    getUserType,
    getPostLoginRoute
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}