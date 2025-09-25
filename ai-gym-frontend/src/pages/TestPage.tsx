import React from 'react'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          🎉 AI Gym - Test Page
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ Aplicación funcionando</h3>
            <p className="text-green-700 text-sm">
              La aplicación React está cargando correctamente
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🔗 Variables de entorno</h3>
            <div className="text-blue-700 text-sm space-y-1">
              <div>URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante'}</div>
              <div>Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante'}</div>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <a 
              href="/login" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Ir al Login
            </a>
            <div>
              <a 
                href="/test-supabase" 
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                🔗 Test de Conexión Supabase
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
