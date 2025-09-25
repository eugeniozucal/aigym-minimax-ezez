import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X, Eye, Dumbbell, Package, Calendar } from 'lucide-react';
import { BlockRenderer } from './BlockRenderer';
export function PreviewModal({ pageData, currentPageId, isOpen, onClose }) {
    if (!isOpen)
        return null;
    const currentPage = pageData.pages.find(page => page.id === currentPageId) || pageData.pages[0];
    const blocks = currentPage?.blocks || [];
    // Repository configuration for icon
    const getRepositoryIcon = (repo) => {
        switch (repo) {
            case 'wods': return Dumbbell;
            case 'blocks': return Package;
            case 'programs': return Calendar;
            default: return Eye;
        }
    };
    const RepositoryIcon = getRepositoryIcon(pageData.targetRepository);
    const getRepositoryColor = (repo) => {
        switch (repo) {
            case 'wods': return 'orange';
            case 'blocks': return 'blue';
            case 'programs': return 'purple';
            default: return 'gray';
        }
    };
    const color = getRepositoryColor(pageData.targetRepository);
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `h-10 w-10 rounded-lg flex items-center justify-center ${color === 'orange' ? 'bg-orange-600' :
                                        color === 'blue' ? 'bg-blue-600' :
                                            color === 'purple' ? 'bg-purple-600' : 'bg-gray-600'}`, children: _jsx(RepositoryIcon, { className: "h-5 w-5 text-white" }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900", children: ["Preview: ", pageData.title] }), _jsxs("p", { className: "text-sm text-gray-600", children: [pageData.targetRepository.toUpperCase(), " \u2022 ", pageData.status, " \u2022 ", blocks.length, " blocks"] })] })] }), _jsx("button", { onClick: onClose, className: "p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-8 bg-gray-50", children: _jsxs("div", { className: "max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: `text-3xl font-bold mb-4 ${color === 'orange' ? 'text-orange-900' :
                                            color === 'blue' ? 'text-blue-900' :
                                                color === 'purple' ? 'text-purple-900' : 'text-gray-900'}`, children: pageData.title }), pageData.description && (_jsx("p", { className: "text-lg text-gray-600 leading-relaxed", children: pageData.description })), _jsxs("div", { className: "flex items-center space-x-6 mt-4 text-sm text-gray-500", children: [pageData.settings.estimatedDuration && (_jsxs("span", { children: ["Duration: ", pageData.settings.estimatedDuration, " minutes"] })), pageData.settings.difficulty && (_jsxs("span", { children: ["Difficulty: ", pageData.settings.difficulty, "/5"] })), pageData.settings.tags && pageData.settings.tags.length > 0 && (_jsxs("span", { children: ["Tags: ", pageData.settings.tags.join(', ')] }))] })] }), blocks.length === 0 ? (_jsxs("div", { className: "text-center py-16", children: [_jsx("div", { className: "text-4xl text-gray-400 mb-4", children: "\uD83D\uDCC4" }), _jsx("h3", { className: "text-xl font-medium text-gray-900 mb-2", children: "No content yet" }), _jsx("p", { className: "text-gray-600", children: "Add some blocks to see the preview content." })] })) : (_jsx("div", { className: "space-y-6", children: blocks.map((block) => (_jsx("div", { className: "preview-block", children: _jsx(BlockRenderer, { block: block, isSelected: false, canMoveUp: false, canMoveDown: false, onSelect: () => { }, onMoveUp: () => { }, onMoveDown: () => { }, isPreview: true }) }, block.id))) }))] }) }), _jsxs("div", { className: "flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Preview mode \u2022 Changes are not saved automatically" }), _jsx("button", { onClick: onClose, className: `px-4 py-2 text-white rounded-lg transition-colors ${color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                                color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                                    color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}`, children: "Close Preview" })] })] }) }));
}
