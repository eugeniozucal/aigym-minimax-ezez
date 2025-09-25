import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection by trying to get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          // If user check fails, try a simple query to test connection
          const { data, error } = await supabase
            .from('pg_tables')
            .select('tablename')
            .limit(1)
          
          if (error) {
            throw new Error(`Connection failed: ${error.message}`)
          }
        }
        
        setConnectionStatus('connected')
      } catch (err) {
        setConnectionStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {connectionStatus === 'testing' && 'Testing...'}
            {connectionStatus === 'connected' && '✅ Connected'}
            {connectionStatus === 'error' && '❌ Error'}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          <strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
        </div>
        
        <div className="text-sm text-gray-600">
          <strong>Anon Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  )
}
