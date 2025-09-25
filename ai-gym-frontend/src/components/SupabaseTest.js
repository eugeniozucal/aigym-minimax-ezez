import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
export function SupabaseTest() {
    const [connectionStatus, setConnectionStatus] = useState('testing');
    const [error, setError] = useState(null);
    useEffect(() => {
        const testConnection = async () => {
            try {
                // Test basic connection by trying to get current user
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) {
                    // If user check fails, try a simple query to test connection
                    const { data, error } = await supabase
                        .from('pg_tables')
                        .select('tablename')
                        .limit(1);
                    if (error) {
                        throw new Error(`Connection failed: ${error.message}`);
                    }
                }
                setConnectionStatus('connected');
            }
            catch (err) {
                setConnectionStatus('error');
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
        };
        testConnection();
    }, []);
    return (_jsxs("div", { className: "p-6 bg-white rounded-lg shadow-md", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Supabase Connection Test" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: "Status:" }), _jsxs("span", { className: `px-2 py-1 rounded text-sm ${connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                                    connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'}`, children: [connectionStatus === 'testing' && 'Testing...', connectionStatus === 'connected' && '✅ Connected', connectionStatus === 'error' && '❌ Error'] })] }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "URL:" }), " ", import.meta.env.VITE_SUPABASE_URL || 'Not set'] }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Anon Key:" }), " ", import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'] }), error && (_jsxs("div", { className: "mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700", children: [_jsx("strong", { children: "Error:" }), " ", error] }))] })] }));
}
