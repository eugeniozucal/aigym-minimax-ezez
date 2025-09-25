import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X, Type, FileText, List, Quote, Minus, Upload, Video, Bot, File, Image, FileImage } from 'lucide-react';
import { WODSettingsPanel } from './WODSettingsPanel';
export function DeployedLeftMenu({ menuType, onBlockAdd, onClose, wodData, onWodDataUpdate }) {
    const elementsBlocks = [
        { type: 'section-header', label: 'Section Header', icon: Type },
        { type: 'rich-text', label: 'Rich Text', icon: FileText },
        { type: 'list', label: 'List', icon: List },
        { type: 'division', label: 'Division', icon: Minus },
        { type: 'quiz', label: 'Quiz', icon: FileText },
        { type: 'quote', label: 'Quote', icon: Quote },
        { type: 'image-upload', label: 'Image Upload', icon: Upload }
    ];
    const contentBlocks = [
        { type: 'video', label: 'Video', icon: Video },
        { type: 'ai-agent', label: 'AI Agent', icon: Bot },
        { type: 'document', label: 'Document', icon: File },
        { type: 'prompt', label: 'Prompts', icon: FileText },
        { type: 'automation', label: 'Automation', icon: FileText },
        { type: 'image', label: 'Image', icon: Image },
        { type: 'pdf', label: 'PDF', icon: FileImage }
    ];
    const renderContent = () => {
        switch (menuType) {
            case 'settings':
                return (_jsx(WODSettingsPanel, { wodData: wodData, onUpdate: onWodDataUpdate }));
            case 'elements':
                return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Elements" }), _jsx("p", { className: "text-sm text-gray-600 mb-6", children: "Basic building blocks for your content" }), _jsx("div", { className: "space-y-2", children: elementsBlocks.map((block) => {
                                const Icon = block.icon;
                                return (_jsxs("button", { onClick: () => onBlockAdd(block.type), className: "\n                      w-full flex items-center space-x-3 p-3 text-left\n                      border border-gray-200 rounded-lg\n                      hover:bg-gray-50 hover:border-gray-300\n                      transition-all duration-200\n                    ", children: [_jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: _jsx(Icon, { className: "h-4 w-4 text-blue-600" }) }), _jsx("span", { className: "font-medium text-gray-900", children: block.label })] }, block.type));
                            }) })] }));
            case 'content':
                return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Content" }), _jsx("p", { className: "text-sm text-gray-600 mb-6", children: "Select content from your repository" }), _jsx("div", { className: "space-y-2", children: contentBlocks.map((block) => {
                                const Icon = block.icon;
                                return (_jsxs("button", { onClick: () => onBlockAdd(block.type), className: "\n                      w-full flex items-center space-x-3 p-3 text-left\n                      border border-gray-200 rounded-lg\n                      hover:bg-gray-50 hover:border-gray-300\n                      transition-all duration-200\n                    ", children: [_jsx("div", { className: "p-2 bg-green-100 rounded-lg", children: _jsx(Icon, { className: "h-4 w-4 text-green-600" }) }), _jsx("span", { className: "font-medium text-gray-900", children: block.label })] }, block.type));
                            }) })] }));
            case 'pages':
                return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Pages" }), _jsx("p", { className: "text-sm text-gray-600 mb-6", children: "Manage your content pages" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("button", { className: "\n                w-full p-3 text-left border border-gray-200 rounded-lg\n                hover:bg-gray-50 hover:border-gray-300\n                transition-all duration-200\n              ", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Create New Page" }), _jsx("div", { className: "text-sm text-gray-600", children: "Add a new page to this content" })] }), _jsxs("button", { className: "\n                w-full p-3 text-left border border-gray-200 rounded-lg\n                hover:bg-gray-50 hover:border-gray-300\n                transition-all duration-200\n              ", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Rename Pages" }), _jsx("div", { className: "text-sm text-gray-600", children: "Edit page titles" })] }), _jsxs("button", { className: "\n                w-full p-3 text-left border border-gray-200 rounded-lg\n                hover:bg-gray-50 hover:border-gray-300\n                transition-all duration-200\n              ", children: [_jsx("div", { className: "font-medium text-gray-900", children: "Reorganize Pages" }), _jsx("div", { className: "text-sm text-gray-600", children: "Change page order" })] })] })] }));
            default:
                return _jsx("div", { className: "p-6", children: "Menu content not implemented" });
        }
    };
    return (_jsxs("div", { className: "w-80 bg-gray-100 border-r border-gray-200 flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200", children: [_jsx("h2", { className: "font-semibold text-gray-900 capitalize", children: menuType }), _jsx("button", { onClick: onClose, className: "p-1 text-gray-400 hover:text-gray-600 rounded", children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: renderContent() })] }));
}
