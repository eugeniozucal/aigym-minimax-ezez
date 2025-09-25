import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Eye, EyeOff, Building2 } from 'lucide-react';
export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user, signIn } = useAuth();
    const location = useLocation();
    // Smart redirect based on user role
    const getRedirectPath = () => {
        const from = location.state?.from?.pathname;
        if (from && from !== '/')
            return from;
        // For now, redirect all users to training zone
        return '/training-zone';
    };
    if (user) {
        return _jsx(Navigate, { to: getRedirectPath(), replace: true });
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
            setError(signInError);
        }
        setIsLoading(false);
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center px-4", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4", children: _jsx(Building2, { className: "h-8 w-8 text-white" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900", children: "AI GYM Platform" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Training and Content Management" })] }), _jsxs("div", { className: "bg-white shadow-lg rounded-xl border border-gray-200 p-8", children: [_jsxs("form", { className: "space-y-6", onSubmit: handleSubmit, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-2", children: "Email Address" }), _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors", placeholder: "admin@example.com", disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-2", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "password", name: "password", type: showPassword ? 'text' : 'password', autoComplete: "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors", placeholder: "Enter your password", disabled: isLoading }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center", onClick: () => setShowPassword(!showPassword), disabled: isLoading, children: showPassword ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400" })) })] })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-sm text-red-800", children: error }) })), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm", className: "mr-2" }), "Signing in..."] })) : ('Sign In') })] }), _jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 font-medium mb-1", children: "Demo Credentials:" }), _jsx("p", { className: "text-xs text-gray-500", children: "Email: ez@aiworkify.com" }), _jsx("p", { className: "text-xs text-gray-500", children: "Password: EzU8264!" })] })] })] }) }));
}
