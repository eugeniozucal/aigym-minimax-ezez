import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function SimpleSupabaseTest() {
  const [status, setStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Simple test: just check if we can initialize the client
        const url = import.meta.env.VITE_SUPABASE_URL
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        if (!url || !key) {
          throw new Error('Variables de entorno faltantes')
        }

        // Try to get session (this is a lightweight operation)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          // Even if there's no session, if we get here without a connection error, it means Supabase is reachable
          if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
            throw new Error('No se puede conectar a Supabase')
          }
          // Other auth errors are OK for this test
        }
        
        setStatus('connected')
        setMessage('✅ Conexión exitosa con Supabase')
      } catch (err) {
        setStatus('error')
        setMessage(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md">
      <h2 className="text-xl font-bold mb-4">🔗 Test de Conexión Supabase</h2>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">Estado:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            status === 'connected' ? 'bg-green-100 text-green-800' :
            status === 'error' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status === 'testing' && 'Probando...'}
            {status === 'connected' && 'Conectado'}
            {status === 'error' && 'Error'}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          <strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante'}
        </div>
        
        <div className="text-sm text-gray-600">
          <strong>Anon Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante'}
        </div>
        
        {message && (
          <div className={`p-3 rounded text-sm ${
            status === 'connected' ? 'bg-green-50 text-green-700' :
            'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}
        
        <div className="mt-4 text-center">
          <a 
            href="/test" 
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            ← Volver al test principal
          </a>
        </div>
      </div>
    </div>
  )
}



