import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { FolderOpen, ChevronDown, X, } from 'lucide-react';
/**
 * MoveToFolderModal - Modal dialog for selecting a folder to move an item to
 */
export const MoveToFolderModal = ({ isOpen, onClose, onMoveToFolder, folders, repositoryType, isMoving = false, itemName = 'item', }) => {
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    // Theme colors based on repository type
    const themeColors = {
        wods: {
            primary: 'bg-orange-600 hover:bg-orange-700 text-white',
            focus: 'focus:ring-orange-500 focus:border-orange-500',
        },
        blocks: {
            primary: 'bg-blue-600 hover:bg-blue-700 text-white',
            focus: 'focus:ring-blue-500 focus:border-blue-500',
        },
    };
    const theme = themeColors[repositoryType];
    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedFolderId(null);
            setShowDropdown(false);
        }
    }, [isOpen]);
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);
    const handleMove = async () => {
        try {
            await onMoveToFolder(selectedFolderId);
            onClose();
        }
        catch (error) {
            console.error('Error moving item:', error);
        }
    };
    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-md mx-4", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FolderOpen, { className: "h-5 w-5 text-gray-600" }), _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Move to Folder" })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition-colors", disabled: isMoving, children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Select a folder to move \"", itemName, "\" to:"] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Destination Folder" }), _jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { type: "button", onClick: () => setShowDropdown(!showDropdown), className: `w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between ${theme.focus} transition-colors`, disabled: isMoving, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FolderOpen, { className: "h-4 w-4" }), _jsx("span", { children: selectedFolder ? selectedFolder.name : 'Root (No folder)' })] }), _jsx(ChevronDown, { className: "h-4 w-4" })] }), showDropdown && (_jsx("div", { className: "absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto", children: _jsxs("div", { className: "py-1", children: [_jsxs("button", { type: "button", onClick: () => {
                                                            setSelectedFolderId(null);
                                                            setShowDropdown(false);
                                                        }, className: "w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2", children: [_jsx(FolderOpen, { className: "h-4 w-4" }), "Root (No folder)"] }), folders.map((folder) => (_jsxs("button", { type: "button", onClick: () => {
                                                            setSelectedFolderId(folder.id);
                                                            setShowDropdown(false);
                                                        }, className: "w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2", children: [_jsx(FolderOpen, { className: "h-4 w-4" }), folder.name] }, folder.id)))] }) }))] })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", disabled: isMoving, children: "Cancel" }), _jsx("button", { type: "button", onClick: handleMove, className: `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme.primary} disabled:opacity-50`, disabled: isMoving, children: isMoving ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" }), "Moving..."] })) : (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FolderOpen, { className: "h-4 w-4" }), "Move"] })) })] })] })] }) }));
};
export default MoveToFolderModal;
