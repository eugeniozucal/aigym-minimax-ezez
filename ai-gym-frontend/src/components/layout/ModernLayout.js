import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ModernHeader } from './ModernHeader';
export function ModernLayout({ children }) {
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(ModernHeader, {}), _jsx("main", { className: "flex-1", children: children })] }));
}
