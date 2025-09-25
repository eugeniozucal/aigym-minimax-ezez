import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { ChevronDown, BarChart3, Users, FileText, Settings, LogOut, User } from 'lucide-react';
export function ModernHeader() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigationSections = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: BarChart3,
            path: '/dashboard',
            description: 'Analytics and overview'
        },
        {
            id: 'communities',
            label: 'Communities',
            icon: Users,
            path: '/communities',
            description: 'Community management'
        },
        {
            id: 'content',
            label: 'Content Repositories',
            icon: FileText,
            path: '/content',
            description: 'Content management',
            subItems: [
                { label: 'AI Agents', path: '/content/ai-agents' },
                { label: 'Videos', path: '/content/videos' },
                { label: 'Documents', path: '/content/documents' },
                { label: 'Prompts', path: '/content/prompts' },
                { label: 'Automations', path: '/content/automations' }
            ]
        }
    ];
    const getCurrentSection = () => {
        return navigationSections.find(section => location.pathname.startsWith(section.path)) || navigationSections[0];
    };
    const currentSection = getCurrentSection();
    return (_jsx("header", { className: "bg-white border-b border-gray-200 shadow-sm", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("img", { className: "h-8 w-auto", src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F59E0B'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E", alt: "AI Workify" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "AI Workify" }), _jsx("p", { className: "text-xs text-gray-500", children: "Admin Panel" })] })] }), _jsx("nav", { className: "hidden md:flex items-center space-x-8", children: navigationSections.map((section) => {
                                const Icon = section.icon;
                                const isActive = currentSection.id === section.id;
                                return (_jsxs(Link, { to: section.path, className: `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`, children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { children: section.label }), section.subItems && (_jsx(ChevronDown, { className: "h-3 w-3" }))] }, section.id));
                            }) }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setUserMenuOpen(!userMenuOpen), className: "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center", children: _jsx(User, { className: "h-4 w-4 text-white" }) }), _jsxs("div", { className: "hidden sm:block text-left", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: user?.email?.split('@')[0] || 'User' }), _jsx("p", { className: "text-xs text-gray-500", children: "Super Admin" })] }), _jsx(ChevronDown, { className: "h-4 w-4 text-gray-500" })] }), userMenuOpen && (_jsx("div", { className: "absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50", children: _jsxs("div", { className: "py-1", children: [_jsxs("div", { className: "px-4 py-3 border-b border-gray-100", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: user?.email }), _jsx("p", { className: "text-xs text-gray-500", children: "Super Admin" })] }), _jsxs(Link, { to: "/settings", className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50", onClick: () => setUserMenuOpen(false), children: [_jsx(Settings, { className: "h-4 w-4 mr-3 text-gray-400" }), "Settings"] }), _jsxs("button", { onClick: () => {
                                                    setUserMenuOpen(false);
                                                    signOut();
                                                }, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50", children: [_jsx(LogOut, { className: "h-4 w-4 mr-3 text-gray-400" }), "Sign Out"] })] }) }))] })] }), _jsx("div", { className: "border-t border-gray-100 bg-gray-50 px-4 sm:px-6 lg:px-8 py-2", children: _jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx(currentSection.icon, { className: "h-4 w-4 text-gray-500" }), _jsx("span", { className: "font-medium text-gray-900", children: currentSection.label }), _jsx("span", { className: "text-gray-500", children: "\u2022" }), _jsx("span", { className: "text-gray-600", children: currentSection.description })] }) })] }) }));
}
