import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  // Session validation with timeout and error handling
  const validateSession = async () => {
    try {
      // Create timeout promise (5 seconds max)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session validation timeout')), 5000)
      )
      
      // Race between getSession and timeout
      const sessionPromise = supabase.auth.getSession()
      const result = await Promise.race([sessionPromise, timeoutPromise])
      
      if (!mountedRef.current) return
      
      const { data: { session }, error } = result as any
      
      if (error) {
        console.warn('Session validation error:', error)
        // Clear corrupted session data
        await supabase.auth.signOut()
        setUser(null)
      } else {
        setUser(session?.user ?? null)
      }
      
    } catch (error) {
      console.warn('Session validation failed:', error)
      
      if (!mountedRef.current) return
      
      // Clear corrupted session on timeout/error
      try {
        await supabase.auth.signOut()
        // Clear localStorage manually as fallback
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-qlxgpvezqotdwghjzjpx-auth-token')
      } catch (cleanupError) {
        console.warn('Session cleanup error:', cleanupError)
      }
      
      setUser(null)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // Initial session validation
    validateSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return
        
        console.log('Auth state change:', event)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cleanup
    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { error: error.message }
      }
      
      return {}
    } catch (error) {
      return { error: 'Error inesperado al iniciar sesión' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


