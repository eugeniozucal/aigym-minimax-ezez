import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Header } from './Header';
export function Layout({ children }) {
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsx("main", { className: "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8", children: children })] }));
}
