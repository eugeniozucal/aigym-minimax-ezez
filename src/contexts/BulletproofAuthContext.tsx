import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { authService, type UserWithRole } from '@/lib/auth-service'
import { roleManagementService } from '@/lib/role-management'
import { AUTH_ERRORS } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: UserWithRole | null
  admin: any | null  // Backward compatibility - derived from user.role
  loading: boolean
  sessionExpired: boolean
  signIn: (email: string, password: string) => Promise<{ success?: boolean; error?: string; redirectTo?: string }>
  signOut: () => Promise<void>
  hasPermission: (permission: 'admin' | 'community_access' | 'role_management') => Promise<boolean>
  refreshUser: () => Promise<void>
  validateRouteAccess: (route: string) => Promise<{ hasAccess: boolean; redirectTo?: string; userRole?: string }>
  clearSessionExpired: () => void
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
 * Fixed session timeout and recovery issues
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const mountedRef = useRef(true)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clear loading timeout helper
  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }, [])

  // Safe loading state management with timeout protection
  const setLoadingState = useCallback((isLoading: boolean) => {
    if (!mountedRef.current) return
    
    clearLoadingTimeout()
    setLoading(isLoading)
    
    if (isLoading) {
      // Safety timeout to prevent infinite loading (CRITICAL FIX)
      loadingTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.warn('Auth loading timeout - forcing completion to prevent infinite loops')
          setLoading(false)
          setInitialized(true)
        }
      }, 10000) // 10 second maximum loading time
    }
  }, [clearLoadingTimeout])

  // Load user data safely
  const loadUser = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      setLoadingState(true)
      const userData = await authService.getAuthenticatedUser()
      
      if (mountedRef.current) {
        setUser(userData)
        setSessionExpired(false)
      }
    } catch (error) {
      console.error('Error loading user:', error)
      
      if (mountedRef.current) {
        setUser(null)
        // Check if this is a session expiration error
        if (error?.message?.includes('session') || error?.message?.includes('expired') || error?.message?.includes('JWT')) {
          setSessionExpired(true)
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoadingState(false)
        setInitialized(true)
      }
    }
  }, [setLoadingState])

  // Session health check to detect timeouts
  const checkSessionHealth = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        if (mountedRef.current && user) {
          console.log('Session expired or invalid, clearing user state')
          setUser(null)
          setSessionExpired(true)
          authService.clearCache()
        }
      }
    } catch (error) {
      console.error('Session health check failed:', error)
      if (mountedRef.current && user) {
        setSessionExpired(true)
      }
    }
  }, [user])

  // Initialize authentication state
  useEffect(() => {
    loadUser()

    // Set up auth listener - CRITICAL: NO ASYNC OPERATIONS IN CALLBACK
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return
        
        console.log('Auth state change:', event)
        
        // Handle different auth events WITHOUT async operations
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null)
          setSessionExpired(false)
          authService.clearCache()
        } else if (event === 'SIGNED_IN') {
          // Clear expired session flag on successful sign in
          setSessionExpired(false)
          // Trigger user data refresh outside of callback
          setTimeout(() => {
            if (mountedRef.current) {
              loadUser()
            }
          }, 100)
        } else if (event === 'TOKEN_REFRESHED') {
          // Session refreshed successfully, clear expired flag
          setSessionExpired(false)
          // Trigger user data refresh outside of callback
          setTimeout(() => {
            if (mountedRef.current) {
              loadUser()
            }
          }, 100)
        }
      }
    )

    // Set up periodic session health check
    sessionCheckIntervalRef.current = setInterval(() => {
      checkSessionHealth()
    }, 60000) // Check every minute

    return () => {
      subscription.unsubscribe()
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current)
      }
    }
  }, [loadUser, checkSessionHealth])

  // Enhanced sign in with session recovery
  const signIn = useCallback(async (email: string, password: string) => {
    if (!mountedRef.current) return { success: false, error: 'Component unmounted' }
    
    setLoadingState(true)
    
    try {
      // Clear any existing session issues
      setSessionExpired(false)
      authService.clearCache()
      
      const result = await authService.signIn(email, password)
      
      if (result.success) {
        // Successful login - user state will be updated by auth state listener
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
      if (mountedRef.current) {
        setLoadingState(false)
      }
    }
  }, [setLoadingState])

  // Enhanced sign out with cleanup
  const signOut = useCallback(async () => {
    try {
      setLoadingState(true)
      setSessionExpired(false)
      setUser(null)
      authService.clearCache()
      await authService.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      if (mountedRef.current) {
        setLoadingState(false)
      }
    }
  }, [setLoadingState])

  // Check permissions with session validation
  const hasPermission = useCallback(async (permission: 'admin' | 'community_access' | 'role_management') => {
    try {
      return await roleManagementService.hasPermission(permission)
    } catch (error) {
      console.error('Permission check failed:', error)
      // Check if this is a session issue
      if (error?.message?.includes('session') || error?.message?.includes('expired')) {
        if (mountedRef.current) {
          setSessionExpired(true)
        }
      }
      return false
    }
  }, [])

  // Refresh user data with session validation
  const refreshUser = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      const userData = await authService.getAuthenticatedUser()
      if (mountedRef.current) {
        setUser(userData)
        setSessionExpired(false)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      if (mountedRef.current) {
        if (error?.message?.includes('session') || error?.message?.includes('expired')) {
          setSessionExpired(true)
        }
        setUser(null)
      }
    }
  }, [])

  // Validate route access with session validation
  const validateRouteAccess = useCallback(async (route: string) => {
    try {
      return await roleManagementService.validateRouteAccess(route)
    } catch (error) {
      console.error('Route access validation failed:', error)
      // Check if this is a session issue
      if (error?.message?.includes('session') || error?.message?.includes('expired')) {
        if (mountedRef.current) {
          setSessionExpired(true)
        }
      }
      return { hasAccess: false, redirectTo: '/login' }
    }
  }, [])

  // Clear session expired flag
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      clearLoadingTimeout()
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current)
      }
    }
  }, [clearLoadingTimeout])

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
    sessionExpired,
    signIn,
    signOut,
    hasPermission,
    refreshUser,
    validateRouteAccess,
    clearSessionExpired,
    getUserType,
    getPostLoginRoute
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}