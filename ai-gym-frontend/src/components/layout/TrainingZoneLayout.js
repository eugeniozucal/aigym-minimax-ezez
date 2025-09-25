import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { LayoutDashboard, Dumbbell, Package, Calendar, ChevronRight } from 'lucide-react';
export function TrainingZoneLayout() {
    const location = useLocation();
    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/training-zone/dashboard',
            icon: LayoutDashboard,
            description: 'Overview and statistics'
        },
        {
            name: 'WODs',
            href: '/training-zone/wods',
            icon: Dumbbell,
            description: 'Workouts of the Day'
        },
        {
            name: 'BLOCKS',
            href: '/training-zone/blocks',
            icon: Package,
            description: 'Modular workout blocks'
        },
        {
            name: 'PROGRAMS',
            href: '/training-zone/programs',
            icon: Calendar,
            description: 'Structured training programs'
        }
    ];
    const isActiveRoute = (href) => {
        if (href === '/training-zone/dashboard') {
            return location.pathname === '/training-zone' || location.pathname === href;
        }
        return location.pathname.startsWith(href);
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "flex min-h-screen bg-gray-50", children: [_jsxs("div", { className: "w-80 bg-white border-r border-gray-200 shadow-sm", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-sm", children: _jsx(Dumbbell, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Training Zone" }), _jsx("p", { className: "text-sm text-gray-600", children: "Administrative Hub" })] })] }) }), _jsx("div", { className: "p-4 space-y-2", children: navigationItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = isActiveRoute(item.href);
                                return (_jsxs(Link, { to: item.href, className: `
                    flex items-center justify-between p-4 rounded-lg transition-all group
                    ${isActive
                                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
                  `, children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Icon, { className: `h-5 w-5 ${isActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'}` }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: item.name }), _jsx("p", { className: `text-xs ${isActive ? 'text-orange-600' : 'text-gray-500'}`, children: item.description })] })] }), _jsx(ChevronRight, { className: `h-4 w-4 ${isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}` })] }, item.name));
                            }) })] }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(Outlet, {}) })] }) }));
}
export default TrainingZoneLayout;
