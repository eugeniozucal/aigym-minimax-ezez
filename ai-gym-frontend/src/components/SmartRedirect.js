import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { LoadingSpinner } from './ui/LoadingSpinner';
export function SmartRedirect() {
    const { user, loading } = useAuth();
    // Show loading while authentication is being determined
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading..." })] }) }));
    }
    // If not authenticated, redirect to login
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    // If authenticated, redirect to training zone for now
    // TODO: Implement proper role-based routing later
    return _jsx(Navigate, { to: "/training-zone", replace: true });
}
