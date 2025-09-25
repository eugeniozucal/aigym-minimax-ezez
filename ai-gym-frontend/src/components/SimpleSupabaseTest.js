import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
export function SimpleSupabaseTest() {
    const [status, setStatus] = useState('testing');
    const [message, setMessage] = useState('');
    useEffect(() => {
        const testConnection = async () => {
            try {
                // Simple test: just check if we can initialize the client
                const url = import.meta.env.VITE_SUPABASE_URL;
                const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
                if (!url || !key) {
                    throw new Error('Variables de entorno faltantes');
                }
                // Try to get session (this is a lightweight operation)
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    // Even if there's no session, if we get here without a connection error, it means Supabase is reachable
                    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
                        throw new Error('No se puede conectar a Supabase');
                    }
                    // Other auth errors are OK for this test
                }
                setStatus('connected');
                setMessage('✅ Conexión exitosa con Supabase');
            }
            catch (err) {
                setStatus('error');
                setMessage(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
            }
        };
        testConnection();
    }, []);
    return (_jsxs("div", { className: "p-6 bg-white rounded-lg shadow-md max-w-md", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "\uD83D\uDD17 Test de Conexi\u00F3n Supabase" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: "Estado:" }), _jsxs("span", { className: `px-2 py-1 rounded text-sm ${status === 'connected' ? 'bg-green-100 text-green-800' :
                                    status === 'error' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'}`, children: [status === 'testing' && 'Probando...', status === 'connected' && 'Conectado', status === 'error' && 'Error'] })] }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "URL:" }), " ", import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante'] }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Anon Key:" }), " ", import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante'] }), message && (_jsx("div", { className: `p-3 rounded text-sm ${status === 'connected' ? 'bg-green-50 text-green-700' :
                            'bg-red-50 text-red-700'}`, children: message })), _jsx("div", { className: "mt-4 text-center", children: _jsx("a", { href: "/test", className: "text-blue-600 hover:text-blue-800 underline text-sm", children: "\u2190 Volver al test principal" }) })] })] }));
}
