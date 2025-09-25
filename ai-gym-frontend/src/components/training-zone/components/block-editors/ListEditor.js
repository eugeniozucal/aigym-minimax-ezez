import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Plus, Trash2 } from 'lucide-react';
export function ListEditor({ block, onUpdate }) {
    const handleChange = (field, value) => {
        onUpdate({
            ...block,
            data: {
                ...block.data,
                [field]: value
            }
        });
    };
    const addItem = () => {
        const items = block.data.items || [];
        handleChange('items', [...items, 'New list item']);
    };
    const removeItem = (index) => {
        const items = block.data.items || [];
        handleChange('items', items.filter((_, i) => i !== index));
    };
    const updateItem = (index, value) => {
        const items = [...(block.data.items || [])];
        items[index] = value;
        handleChange('items', items);
    };
    return (_jsxs("div", { className: "p-6 space-y-4", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "List Settings" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "List Type" }), _jsxs("select", { value: block.data.type || 'bulleted', onChange: (e) => handleChange('type', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "bulleted", children: "Bulleted List" }), _jsx("option", { value: "numbered", children: "Numbered List" }), _jsx("option", { value: "checklist", children: "Checklist" })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "List Items" }), _jsxs("button", { onClick: addItem, className: "flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200", children: [_jsx(Plus, { className: "h-3 w-3" }), _jsx("span", { children: "Add Item" })] })] }), _jsx("div", { className: "space-y-2", children: (block.data.items || ['List item 1']).map((item, index) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "text", value: item, onChange: (e) => updateItem(index, e.target.value), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "List item..." }), _jsx("button", { onClick: () => removeItem(index), className: "p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, index))) })] }), _jsx("div", { className: "border-t border-gray-200 pt-4", children: _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: block.data.interactive || false, onChange: (e) => handleChange('interactive', e.target.checked), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700", children: "Make Interactive (for checklists)" })] }) })] }));
}
