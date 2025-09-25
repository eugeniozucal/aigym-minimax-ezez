import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ArrowLeft, Save, Eye, Users, Package, Dumbbell, Calendar, X, AlertCircle, CheckCircle } from 'lucide-react';
import { BlockRenderer } from './BlockRenderer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
export function CenterCanvas({ wodData, currentPageId, onPageChange, selectedBlock, onBlockSelect, onBlockReorder, onBlockDelete, onBackToRepository, onSave, saving, targetRepository = 'wods', onRepositoryChange, error, onClearError, successMessage, onClearSuccess, onPreview }) {
    const currentPage = wodData.pages.find(page => page.id === currentPageId) || wodData.pages[0];
    const blocks = currentPage?.blocks || [];
    // Repository configuration
    const REPOSITORY_CONFIG = {
        wods: {
            name: 'WODs',
            color: 'orange',
            icon: Dumbbell
        },
        blocks: {
            name: 'BLOCKS',
            color: 'blue',
            icon: Package
        },
        programs: {
            name: 'PROGRAMS',
            color: 'purple',
            icon: Calendar
        }
    };
    const config = REPOSITORY_CONFIG[targetRepository];
    const RepositoryIcon = config.icon;
    return (_jsxs("div", { className: "flex-1 flex flex-col bg-white h-full", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("button", { onClick: onBackToRepository, className: "flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm font-medium", children: "Back to Training Zone" })] }), _jsxs("div", { className: "border-l border-gray-300 pl-4", children: [_jsx("h1", { className: "text-lg font-semibold text-gray-900", children: wodData.title }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-500", children: [_jsxs("span", { children: [wodData.pages.length, " pages"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: ["Page: ", currentPage?.title || 'Untitled'] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { className: `inline-flex items-center space-x-1 ${wodData.status === 'published' ? 'text-green-600' : 'text-yellow-600'}`, children: [_jsx(Eye, { className: "h-3 w-3" }), _jsx("span", { className: "capitalize", children: wodData.status })] })] })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: onPreview, disabled: !onPreview, className: "flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Eye, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: "Preview" })] }), onRepositoryChange && (_jsx("div", { className: "relative", children: _jsxs("select", { value: targetRepository, onChange: (e) => onRepositoryChange(e.target.value), className: `
                  flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium 
                  focus:ring-2 focus:ring-offset-2 transition-colors
                  ${config.color === 'orange'
                                        ? 'focus:ring-orange-500 focus:border-orange-500'
                                        : config.color === 'blue'
                                            ? 'focus:ring-blue-500 focus:border-blue-500'
                                            : 'focus:ring-purple-500 focus:border-purple-500'}
                `, children: [_jsx("option", { value: "wods", children: "Save to WODs" }), _jsx("option", { value: "blocks", children: "Save to BLOCKS" }), _jsx("option", { value: "programs", children: "Save to PROGRAMS" })] }) })), _jsxs("button", { onClick: onSave, disabled: saving, className: `
              flex items-center space-x-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-colors
              ${config.color === 'orange'
                                    ? 'bg-orange-600 hover:bg-orange-700'
                                    : config.color === 'blue'
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-purple-600 hover:bg-purple-700'}
            `, children: [saving ? (_jsx(LoadingSpinner, { size: "sm" })) : (_jsxs(_Fragment, { children: [_jsx(RepositoryIcon, { className: "h-4 w-4" }), _jsx(Save, { className: "h-4 w-4" })] })), _jsx("span", { className: "text-sm", children: saving ? 'Saving...' : `Save ${config.name.slice(0, -1)}` })] })] })] }), error && (_jsx("div", { className: "bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded-r-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-red-400 mr-3" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-red-800", children: "Save Failed" }), _jsx("p", { className: "text-sm text-red-700", children: error })] })] }), onClearError && (_jsx("button", { onClick: onClearError, className: "text-red-400 hover:text-red-600 transition-colors", children: _jsx(X, { className: "h-4 w-4" }) }))] }) })), successMessage && (_jsx("div", { className: "bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-4 rounded-r-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-400 mr-3" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-green-800", children: "Success!" }), _jsx("p", { className: "text-sm text-green-700", children: successMessage })] })] }), onClearSuccess && (_jsx("button", { onClick: onClearSuccess, className: "text-green-400 hover:text-green-600 transition-colors", children: _jsx(X, { className: "h-4 w-4" }) }))] }) })), wodData.pages.length > 1 && (_jsxs("div", { className: "flex items-center space-x-1 px-6 py-3 border-b border-gray-200 bg-gray-50", children: [wodData.pages.map((page) => (_jsxs("button", { onClick: () => onPageChange(page.id), className: `
                px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${currentPageId === page.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `, children: [_jsx("span", { children: page.title }), _jsxs("span", { className: "ml-2 text-xs text-gray-500", children: ["(", page.blocks.length, " blocks)"] })] }, page.id))), _jsx("button", { className: "flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx("span", { className: "text-sm", children: "+ New Page" }) })] })), _jsx("div", { className: "flex-1 overflow-y-auto overflow-x-hidden p-8 bg-white min-h-0", children: _jsx("div", { className: "max-w-4xl mx-auto", children: blocks.length === 0 ? (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "text-6xl text-gray-400 mb-6", children: "\uD83D\uDE80" }), _jsxs("h2", { className: "text-2xl font-semibold text-gray-900 mb-4", children: ["Start building your ", config.name.slice(0, -1)] }), _jsxs("p", { className: "text-gray-600 mb-8 max-w-md mx-auto", children: ["Use the left sidebar to add blocks and create engaging content for your ", config.name.toLowerCase().slice(0, -1), "."] }), _jsxs("div", { className: `
                inline-flex items-center space-x-2 px-4 py-2 rounded-lg
                ${config.color === 'orange'
                                    ? 'bg-orange-50 text-orange-700'
                                    : config.color === 'blue'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-purple-50 text-purple-700'}
              `, children: [_jsx(Users, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: "Click any icon in the left navigation to add your first block" })] })] })) : (_jsx("div", { className: "space-y-6", children: blocks.map((block, index) => (_jsx(BlockRenderer, { block: block, isSelected: selectedBlock?.id === block.id, canMoveUp: index > 0, canMoveDown: index < blocks.length - 1, onSelect: () => onBlockSelect(block), onMoveUp: () => onBlockReorder(block.id, 'up'), onMoveDown: () => onBlockReorder(block.id, 'down'), onDelete: onBlockDelete ? () => onBlockDelete(block.id) : undefined }, block.id))) })) }) })] }));
}
