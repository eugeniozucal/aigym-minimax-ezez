import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Building2, ChevronDown, Users, Settings, LogOut, Home, Tag, Bot, Play, FileText, MessageSquare, Zap, Image, FileType, Dumbbell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
export function Header() {
    const { user, signOut } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isContentDropdownOpen, setIsContentDropdownOpen] = useState(false);
    const location = useLocation();
    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Communities', href: '/communities', icon: Building2 },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Tags', href: '/tags', icon: Tag },
        { name: 'Training Zone', href: '/training-zone', icon: Dumbbell },
    ];
    const contentRepositories = [
        { name: 'AI Agents', href: '/content/ai-agents', icon: Bot, color: '#3B82F6' },
        { name: 'Videos', href: '/content/videos', icon: Play, color: '#EF4444' },
        { name: 'Documents', href: '/content/documents', icon: FileText, color: '#10B981' },
        { name: 'Images', href: '/content/images', icon: Image, color: '#06B6D4' },
        { name: 'PDFs', href: '/content/pdfs', icon: FileType, color: '#DC2626' },
        { name: 'Prompts', href: '/content/prompts', icon: MessageSquare, color: '#8B5CF6' },
        { name: 'Automations', href: '/content/automations', icon: Zap, color: '#F59E0B' },
    ];
    const handleSignOut = async () => {
        await signOut();
    };
    const isContentActive = location.pathname.startsWith('/content');
    return (_jsx("header", { className: "bg-white shadow-sm border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsx("div", { className: "flex items-center", children: _jsxs(Link, { to: "/dashboard", className: "flex items-center space-x-3", children: [_jsx("div", { className: "h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center", children: _jsx(Building2, { className: "h-5 w-5 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "AI GYM" }), _jsx("p", { className: "text-xs text-gray-500", children: "by AI Workify" })] })] }) }), _jsxs("nav", { className: "hidden md:flex space-x-8", children: [navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                const Icon = item.icon;
                                return (_jsxs(Link, { to: item.href, className: `inline-flex items-center space-x-1 px-1 pt-1 text-sm font-medium transition-colors ${isActive
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'}`, children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { children: item.name })] }, item.name));
                            }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setIsContentDropdownOpen(!isContentDropdownOpen), className: `inline-flex items-center space-x-1 px-1 pt-1 text-sm font-medium transition-colors ${isContentActive
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'}`, children: [_jsx(FileText, { className: "h-4 w-4" }), _jsx("span", { children: "Content" }), _jsx(ChevronDown, { className: "h-3 w-3" })] }), isContentDropdownOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-10", onClick: () => setIsContentDropdownOpen(false) }), _jsx("div", { className: "absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20", children: _jsxs("div", { className: "py-2", children: [_jsx("div", { className: "px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Repositories" }), contentRepositories.map((repo) => {
                                                            const Icon = repo.icon;
                                                            const isActive = location.pathname === repo.href;
                                                            return (_jsxs(Link, { to: repo.href, className: `flex items-center px-3 py-2 text-sm transition-colors ${isActive
                                                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                                                    : 'text-gray-700 hover:bg-gray-50'}`, onClick: () => setIsContentDropdownOpen(false), children: [_jsx(Icon, { className: "mr-3 h-4 w-4", style: { color: repo.color } }), repo.name] }, repo.name));
                                                        })] }) })] }))] })] }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setIsDropdownOpen(!isDropdownOpen), className: "flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white text-sm font-medium", children: user?.email?.charAt(0).toUpperCase() || 'U' }) }), _jsxs("div", { className: "hidden md:block text-left", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: user?.email }), _jsx("p", { className: "text-xs text-gray-500 capitalize", children: "User" })] }), _jsx(ChevronDown, { className: "h-4 w-4 text-gray-400" })] }) }), isDropdownOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-10", onClick: () => setIsDropdownOpen(false) }), _jsx("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20", children: _jsxs("div", { className: "py-1", children: [_jsxs(Link, { to: "/settings", className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", onClick: () => setIsDropdownOpen(false), children: [_jsx(Settings, { className: "mr-3 h-4 w-4" }), "Settings"] }), _jsxs("button", { onClick: handleSignOut, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: [_jsx(LogOut, { className: "mr-3 h-4 w-4" }), "Sign Out"] })] }) })] }))] })] }) }) }));
}
