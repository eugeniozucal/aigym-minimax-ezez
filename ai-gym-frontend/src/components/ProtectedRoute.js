import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useEffect, useRef } from 'react';
export function ProtectedRoute({ children, requireAdmin = false, requireAuth = false }) {
    const { user, loading } = useAuth();
    const timeoutRef = useRef(null);
    const mountedRef = useRef(true);
    // Safety timeout to prevent infinite loading in ProtectedRoute
    useEffect(() => {
        if (loading) {
            timeoutRef.current = setTimeout(() => {
                if (mountedRef.current) {
                    console.warn('ProtectedRoute: Loading timeout reached, check auth system');
                }
            }, 10000); // 10 second timeout
        }
        else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [loading]);
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    // Show loading while authentication is being determined
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Verifying authentication..." })] }) }));
    }
    // For auth-required routes, check if user is authenticated
    if (requireAuth && !user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    // Redirect to login if no user is authenticated (legacy behavior)
    if (!requireAuth && !requireAdmin && !user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    // For admin-required routes, for now just require authentication
    // TODO: Implement proper admin checking later
    if (requireAdmin && !user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
