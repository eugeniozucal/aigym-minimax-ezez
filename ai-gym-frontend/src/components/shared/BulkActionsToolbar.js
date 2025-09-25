import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { X, Folder, Plus, Trash2, Move } from 'lucide-react';
export function BulkActionsToolbar({ selectedCount, onClearSelection, onBulkMove, onBulkDelete, onBulkFavorite, folders, repositoryType, themeColor }) {
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const handleBulkMove = () => {
        onBulkMove(selectedFolderId);
        setShowMoveDialog(false);
        setSelectedFolderId(null);
    };
    const themeClasses = {
        orange: {
            bg: 'bg-orange-600',
            hover: 'hover:bg-orange-700',
            ring: 'focus:ring-orange-500',
            text: 'text-orange-600'
        },
        blue: {
            bg: 'bg-blue-600',
            hover: 'hover:bg-blue-700',
            ring: 'focus:ring-blue-500',
            text: 'text-blue-600'
        }
    }[themeColor];
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: `fixed bottom-0 left-0 right-0 z-50 ${themeClasses.bg} text-white shadow-lg transition-transform duration-300`, children: _jsx("div", { className: "max-w-7xl mx-auto px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: onClearSelection, className: "p-2 hover:bg-white/10 rounded-lg transition-colors", children: _jsx(X, { className: "h-5 w-5" }) }), _jsxs("span", { className: "font-medium", children: [selectedCount, " ", selectedCount === 1 ? 'item' : 'items', " selected"] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: () => onBulkFavorite(true), className: "inline-flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add to Favorites"] }), _jsxs("button", { onClick: () => setShowMoveDialog(true), className: "inline-flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors", children: [_jsx(Move, { className: "h-4 w-4 mr-2" }), "Move to Folder"] }), _jsxs("button", { onClick: onBulkDelete, className: "inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors", children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "Delete Selected"] })] })] }) }) }), showMoveDialog && (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0", children: [_jsx("div", { className: "fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75", onClick: () => setShowMoveDialog(false) }), _jsxs("div", { className: "inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full", children: [_jsx("div", { className: "bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4", children: _jsxs("div", { className: "sm:flex sm:items-start", children: [_jsx("div", { className: `mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${themeClasses.bg}/10 sm:mx-0 sm:h-10 sm:w-10`, children: _jsx(Folder, { className: `h-6 w-6 ${themeClasses.text}` }) }), _jsxs("div", { className: "mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1", children: [_jsxs("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: ["Move ", selectedCount, " ", selectedCount === 1 ? 'item' : 'items'] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Select destination folder:" }), _jsxs("select", { value: selectedFolderId || '', onChange: (e) => setSelectedFolderId(e.target.value || null), className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent`, children: [_jsx("option", { value: "", children: "Root folder (no folder)" }), folders.map((folder) => (_jsxs("option", { value: folder.id, children: ['  '.repeat(folder.depth || 0), folder.name] }, folder.id)))] })] })] })] }) }), _jsxs("div", { className: "bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse", children: [_jsx("button", { type: "button", onClick: handleBulkMove, className: `w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 ${themeClasses.bg} text-base font-medium text-white ${themeClasses.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.ring} sm:ml-3 sm:w-auto sm:text-sm`, children: "Move Items" }), _jsx("button", { type: "button", onClick: () => setShowMoveDialog(false), className: "mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm", children: "Cancel" })] })] })] }) }))] }));
}
