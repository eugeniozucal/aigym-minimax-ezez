import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Trash2, FolderOpen, FolderPlus, Copy, X, ChevronDown, } from 'lucide-react';
/**
 * BulkActionBar - A toolbar that appears when items are selected for bulk operations
 *
 * Features:
 * - Shows selection count
 * - Move to existing folder dropdown
 * - Create new folder and move
 * - Copy and delete bulk actions
 * - Theme-aware styling based on repository type
 * - Clear selection functionality
 */
export const BulkActionBar = ({ selectedCount, folders, repositoryType, onClearSelection, onDeleteSelected, onCopySelected, onMoveToFolder, onCreateFolderAndMove, className = '', }) => {
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);
    const dropdownRef = useRef(null);
    // Theme colors based on repository type
    const themeColors = {
        wods: {
            background: 'bg-orange-50 border-orange-200',
            text: 'text-orange-900',
            button: 'bg-orange-600 hover:bg-orange-700 text-white',
            buttonSecondary: 'border-orange-300 text-orange-700 hover:bg-orange-50',
        },
        blocks: {
            background: 'bg-blue-50 border-blue-200',
            text: 'text-blue-900',
            button: 'bg-blue-600 hover:bg-blue-700 text-white',
            buttonSecondary: 'border-blue-300 text-blue-700 hover:bg-blue-50',
        },
    };
    const theme = themeColors[repositoryType];
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowFolderDropdown(false);
            }
        };
        if (showFolderDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFolderDropdown]);
    const handleFolderSelect = (folderId) => {
        onMoveToFolder(folderId);
        setShowFolderDropdown(false);
    };
    return (_jsxs("div", { className: `
        fixed bottom-6 left-1/2 transform -translate-x-1/2
        ${theme.background}
        border rounded-lg shadow-lg p-4 z-50
        flex items-center gap-4
        min-w-96 max-w-4xl
        ${className}
      `, children: [_jsx("div", { className: `flex items-center gap-2 ${theme.text} font-medium`, children: _jsxs("span", { children: [selectedCount, " item", selectedCount !== 1 ? 's' : '', " selected"] }) }), _jsx("div", { className: "h-6 w-px bg-gray-300" }), _jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setShowFolderDropdown(!showFolderDropdown), className: `flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${theme.buttonSecondary}`, children: [_jsx(FolderOpen, { className: "mr-2 h-4 w-4" }), _jsx("span", { children: "Move to folder" }), _jsx(ChevronDown, { className: "ml-2 h-4 w-4" })] }), showFolderDropdown && (_jsx("div", { className: "absolute bottom-full mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200", children: _jsxs("div", { className: "py-1", children: [_jsx("button", { onClick: () => handleFolderSelect('root'), className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center", children: _jsx("span", { children: "\uD83D\uDDC2\uFE0F Root (No folder)" }) }), folders.map((folder) => (_jsx("button", { onClick: () => handleFolderSelect(folder.id), className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center", children: _jsxs("span", { children: ["\uD83D\uDDC2\uFE0F ", folder.name] }) }, folder.id)))] }) }))] }), _jsxs("button", { onClick: onCreateFolderAndMove, className: `flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${theme.buttonSecondary}`, children: [_jsx(FolderPlus, { className: "mr-2 h-4 w-4" }), "New Folder"] }), _jsxs("button", { onClick: onCopySelected, className: `flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${theme.buttonSecondary}`, children: [_jsx(Copy, { className: "mr-2 h-4 w-4" }), "Copy"] }), _jsxs("button", { onClick: onDeleteSelected, className: "flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors", children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"] }), _jsx("div", { className: "h-6 w-px bg-gray-300" }), _jsx("button", { onClick: onClearSelection, className: "flex items-center p-2 text-gray-500 hover:text-gray-700 transition-colors", title: "Clear selection", children: _jsx(X, { className: "h-4 w-4" }) })] }));
};
export default BulkActionBar;
