import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function QuoteEditor({ block, onUpdate }) {
    const handleChange = (field, value) => {
        onUpdate({
            ...block,
            data: {
                ...block.data,
                [field]: value
            }
        });
    };
    return (_jsxs("div", { className: "p-6 space-y-4", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Quote Settings" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Quote Text" }), _jsx("textarea", { rows: 4, value: block.data.text || '', onChange: (e) => handleChange('text', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Enter quote text..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Author" }), _jsx("input", { type: "text", value: block.data.author || '', onChange: (e) => handleChange('author', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Quote author..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Style" }), _jsxs("select", { value: block.data.style || 'default', onChange: (e) => handleChange('style', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "default", children: "Default" }), _jsx("option", { value: "emphasized", children: "Emphasized" }), _jsx("option", { value: "minimal", children: "Minimal" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Alignment" }), _jsxs("select", { value: block.data.alignment || 'left', onChange: (e) => handleChange('alignment', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "left", children: "Left" }), _jsx("option", { value: "center", children: "Center" }), _jsx("option", { value: "right", children: "Right" })] })] })] }));
}
