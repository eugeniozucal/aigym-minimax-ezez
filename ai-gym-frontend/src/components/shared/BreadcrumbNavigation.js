import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ChevronRight, Home, Folder } from 'lucide-react';
export function BreadcrumbNavigation({ currentPath, onNavigate, repositoryType, themeColor, className = '' }) {
    const themeClasses = {
        orange: {
            text: 'text-orange-600',
            hover: 'hover:text-orange-700'
        },
        blue: {
            text: 'text-blue-600',
            hover: 'hover:text-blue-700'
        }
    }[themeColor];
    // Build the complete breadcrumb path starting with root
    const fullPath = [
        {
            id: null,
            name: `All ${repositoryType.toUpperCase()}`,
            path: 'root'
        },
        ...currentPath
    ];
    return (_jsx("nav", { className: `${className}`, "aria-label": "Breadcrumb", children: _jsx("ol", { className: "flex items-center space-x-1 text-sm text-gray-500", children: fullPath.map((item, index) => {
                const isLast = index === fullPath.length - 1;
                const isRoot = item.id === null;
                return (_jsxs("li", { className: "flex items-center", children: [_jsxs("button", { onClick: () => onNavigate(item.id), className: `flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${isLast
                                ? `${themeClasses.text} font-medium`
                                : `text-gray-500 hover:text-gray-700 ${themeClasses.hover}`}`, disabled: isLast, children: [isRoot ? (_jsx(Home, { className: "h-4 w-4" })) : (_jsx(Folder, { className: "h-4 w-4" })), _jsx("span", { className: "truncate max-w-32", children: item.name })] }), !isLast && (_jsx(ChevronRight, { className: "h-4 w-4 text-gray-400 mx-1 flex-shrink-0" }))] }, item.id || 'root'));
            }) }) }));
}
export function CompactBreadcrumb({ currentFolderName, onNavigateUp, repositoryType, themeColor, className = '' }) {
    const themeClasses = {
        orange: {
            text: 'text-orange-600',
            hover: 'hover:text-orange-700'
        },
        blue: {
            text: 'text-blue-600',
            hover: 'hover:text-blue-700'
        }
    }[themeColor];
    return (_jsxs("div", { className: `flex items-center space-x-2 ${className}`, children: [_jsxs("button", { onClick: onNavigateUp, className: `flex items-center space-x-1 text-sm ${themeClasses.text} ${themeClasses.hover} transition-colors`, children: [_jsx(ChevronRight, { className: "h-4 w-4 rotate-180" }), _jsx("span", { children: "Back" })] }), _jsx("span", { className: "text-sm text-gray-500", children: "\u2022" }), _jsx("div", { className: "flex items-center space-x-1", children: currentFolderName ? (_jsxs(_Fragment, { children: [_jsx(Folder, { className: "h-4 w-4 text-gray-500" }), _jsx("span", { className: "text-sm font-medium text-gray-900 truncate max-w-32", children: currentFolderName })] })) : (_jsxs(_Fragment, { children: [_jsx(Home, { className: "h-4 w-4 text-gray-500" }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: ["All ", repositoryType.toUpperCase()] })] })) })] }));
}
