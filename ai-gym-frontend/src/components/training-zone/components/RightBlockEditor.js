import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X, Settings as SettingsIcon } from 'lucide-react';
import { SectionHeaderEditor } from './block-editors/SectionHeaderEditor';
import { RichTextEditor } from './block-editors/RichTextEditor';
import { ListEditor } from './block-editors/ListEditor';
import { QuoteEditor } from './block-editors/QuoteEditor';
import { QuizEditor } from './block-editors/QuizEditor';
import { ContentBlockEditor } from './block-editors/ContentBlockEditor';
export function RightBlockEditor({ block, onBlockUpdate, onClose, onOpenRepository }) {
    const renderEditor = () => {
        switch (block.type) {
            case 'section-header':
                return (_jsx(SectionHeaderEditor, { block: block, onUpdate: onBlockUpdate }));
            case 'rich-text':
                return (_jsx(RichTextEditor, { block: block, onUpdate: onBlockUpdate }));
            case 'list':
                return (_jsx(ListEditor, { block: block, onUpdate: onBlockUpdate }));
            case 'quote':
                return (_jsx(QuoteEditor, { block: block, onUpdate: onBlockUpdate }));
            case 'quiz':
                return (_jsx(QuizEditor, { block: block, onUpdate: onBlockUpdate }));
            case 'video':
            case 'ai-agent':
            case 'document':
            case 'prompts':
            case 'automation':
            case 'image':
            case 'pdf':
                return (_jsx(ContentBlockEditor, { block: block, onUpdate: onBlockUpdate, onOpenRepository: onOpenRepository }));
            case 'division':
                return (_jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Division Settings" }), _jsx("p", { className: "text-sm text-gray-600", children: "Division blocks create visual separators in your content." }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Style" }), _jsxs("select", { value: block.data.style || 'line', onChange: (e) => onBlockUpdate({
                                        ...block,
                                        data: { ...block.data, style: e.target.value }
                                    }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "line", children: "Line" }), _jsx("option", { value: "dots", children: "Dots" }), _jsx("option", { value: "space", children: "Space" })] })] })] }));
            case 'image-upload':
                return (_jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Image Upload Settings" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Alt Text" }), _jsx("input", { type: "text", value: block.data.alt || '', onChange: (e) => onBlockUpdate({
                                                ...block,
                                                data: { ...block.data, alt: e.target.value }
                                            }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Describe the image..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Caption" }), _jsx("input", { type: "text", value: block.data.caption || '', onChange: (e) => onBlockUpdate({
                                                ...block,
                                                data: { ...block.data, caption: e.target.value }
                                            }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Image caption..." })] })] })] }));
            default:
                return (_jsxs("div", { className: "p-6", children: [_jsxs("h3", { className: "font-medium text-gray-900 mb-4", children: [block.type.charAt(0).toUpperCase() + block.type.slice(1), " Block"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Editor for this block type is not yet implemented." })] }));
        }
    };
    return (_jsxs("div", { className: "w-80 bg-gray-100 border-l border-gray-200 flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(SettingsIcon, { className: "h-4 w-4 text-gray-600" }), _jsx("h2", { className: "font-semibold text-gray-900", children: "Block Editor" })] }), _jsx("button", { onClick: onClose, className: "p-1 text-gray-400 hover:text-gray-600 rounded", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: renderEditor() })] }));
}
