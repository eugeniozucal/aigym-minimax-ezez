import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ChevronRight, Folder, FolderPlus, Home, Search, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
export function FolderManager({ repositoryType, currentFolderId, onFolderSelect, onFolderCreate, onFolderUpdate, onFolderDelete, themeColor, className = '' }) {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const themeClasses = {
        orange: {
            bg: 'bg-orange-600',
            hover: 'hover:bg-orange-700',
            ring: 'focus:ring-orange-500',
            text: 'text-orange-600',
            light: 'bg-orange-50'
        },
        blue: {
            bg: 'bg-blue-600',
            hover: 'hover:bg-blue-700',
            ring: 'focus:ring-blue-500',
            text: 'text-blue-600',
            light: 'bg-blue-50'
        }
    }[themeColor];
    useEffect(() => {
        fetchFolders();
    }, [repositoryType]);
    const fetchFolders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.functions.invoke('folders-api', {
                method: 'GET',
                body: null,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (error) {
                console.error('Error fetching folders:', error);
                return;
            }
            // Filter folders by repository type and build hierarchy
            const repositoryFolders = (data?.data || []).filter((folder) => folder.repository_type === repositoryType);
            setFolders(repositoryFolders);
        }
        catch (error) {
            console.error('Error fetching folders:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateFolder = async (name, parentId = null, color = '#6B7280') => {
        try {
            const folderData = {
                name,
                parent_folder_id: parentId,
                repository_type: repositoryType,
                color
            };
            onFolderCreate(folderData);
            setShowCreateDialog(false);
            await fetchFolders(); // Refresh folders list
        }
        catch (error) {
            console.error('Error creating folder:', error);
        }
    };
    const handleUpdateFolder = async (folderId, name, color) => {
        try {
            onFolderUpdate(folderId, { name, color });
            setEditingFolder(null);
            await fetchFolders(); // Refresh folders list
        }
        catch (error) {
            console.error('Error updating folder:', error);
        }
    };
    const handleDeleteFolder = async (folderId) => {
        if (window.confirm('Are you sure you want to delete this folder? All contents will be moved to the parent folder.')) {
            try {
                onFolderDelete(folderId);
                await fetchFolders(); // Refresh folders list
            }
            catch (error) {
                console.error('Error deleting folder:', error);
            }
        }
    };
    const toggleFolderExpansion = (folderId) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        }
        else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };
    const filteredFolders = folders.filter(folder => folder.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const buildFolderTree = (folders, parentId = null) => {
        return folders
            .filter(folder => folder.parent_folder_id === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));
    };
    const renderFolder = (folder, depth = 0) => {
        const hasChildren = folders.some(f => f.parent_folder_id === folder.id);
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = currentFolderId === folder.id;
        const children = buildFolderTree(folders, folder.id);
        return (_jsxs("div", { children: [_jsxs("div", { className: `flex items-center space-x-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${isSelected ? `${themeClasses.light} ${themeClasses.text}` : 'text-gray-700'}`, style: { paddingLeft: `${depth * 16 + 8}px` }, onClick: () => onFolderSelect(folder.id), children: [hasChildren && (_jsx("button", { onClick: (e) => {
                                e.stopPropagation();
                                toggleFolderExpansion(folder.id);
                            }, className: "p-0.5 hover:bg-gray-200 rounded", children: _jsx(ChevronRight, { className: `h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}` }) })), !hasChildren && _jsx("div", { className: "w-4" }), _jsx(Folder, { className: "h-4 w-4 flex-shrink-0", style: { color: folder.color || '#6B7280' } }), _jsx("span", { className: "flex-1 text-sm truncate", children: folder.name }), _jsxs("div", { className: "flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        setEditingFolder(folder);
                                    }, className: "p-1 hover:bg-gray-200 rounded", children: _jsx(Edit2, { className: "h-3 w-3" }) }), _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(folder.id);
                                    }, className: "p-1 hover:bg-red-100 text-red-600 rounded", children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }), hasChildren && isExpanded && (_jsx("div", { children: children.map(childFolder => renderFolder(childFolder, depth + 1)) }))] }, folder.id));
    };
    const rootFolders = buildFolderTree(filteredFolders, null);
    return (_jsxs("div", { className: `${className}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Folders" }), _jsxs("button", { onClick: () => setShowCreateDialog(true), className: `inline-flex items-center px-3 py-1.5 ${themeClasses.bg} text-white text-sm rounded-lg ${themeClasses.hover} transition-colors`, children: [_jsx(FolderPlus, { className: "h-4 w-4 mr-1" }), "New Folder"] })] }), _jsxs("div", { className: "relative mb-4", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }), _jsx("input", { type: "text", placeholder: "Search folders...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: `w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent text-sm` })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { onClick: () => onFolderSelect(null), className: `flex items-center space-x-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${currentFolderId === null ? `${themeClasses.light} ${themeClasses.text}` : 'text-gray-700'}`, children: [_jsx(Home, { className: "h-4 w-4" }), _jsxs("span", { className: "text-sm", children: ["All ", repositoryType.toUpperCase()] })] }), loading ? (_jsx("div", { className: "text-center py-4 text-sm text-gray-500", children: "Loading folders..." })) : (_jsxs("div", { className: "space-y-1", children: [rootFolders.map(folder => renderFolder(folder)), rootFolders.length === 0 && !loading && (_jsx("div", { className: "text-center py-4 text-sm text-gray-500", children: "No folders yet. Create your first folder!" }))] }))] }), showCreateDialog && (_jsx(CreateFolderDialog, { onSubmit: handleCreateFolder, onCancel: () => setShowCreateDialog(false), themeClasses: themeClasses, parentFolders: folders })), editingFolder && (_jsx(EditFolderDialog, { folder: editingFolder, onSubmit: handleUpdateFolder, onCancel: () => setEditingFolder(null), themeClasses: themeClasses }))] }));
}
function CreateFolderDialog({ onSubmit, onCancel, themeClasses, parentFolders }) {
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState(null);
    const [color, setColor] = useState('#6B7280');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim(), parentId, color);
        }
    };
    const colorOptions = [
        '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
        '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#84CC16'
    ];
    return (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0", children: [_jsx("div", { className: "fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75", onClick: onCancel }), _jsx("div", { className: "inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full", children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("div", { className: "bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4", children: _jsxs("div", { className: "sm:flex sm:items-start", children: [_jsx("div", { className: `mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${themeClasses.bg}/10 sm:mx-0 sm:h-10 sm:w-10`, children: _jsx(FolderPlus, { className: `h-6 w-6 ${themeClasses.text}` }) }), _jsxs("div", { className: "mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1", children: [_jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900 mb-4", children: "Create New Folder" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Folder Name" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "Enter folder name", className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent`, autoFocus: true, required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Parent Folder" }), _jsxs("select", { value: parentId || '', onChange: (e) => setParentId(e.target.value || null), className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent`, children: [_jsx("option", { value: "", children: "Root level (no parent)" }), parentFolders.map((folder) => (_jsx("option", { value: folder.id, children: folder.path || folder.name }, folder.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Color" }), _jsx("div", { className: "flex flex-wrap gap-2", children: colorOptions.map((colorOption) => (_jsx("button", { type: "button", onClick: () => setColor(colorOption), className: `w-8 h-8 rounded-full border-2 transition-all ${color === colorOption ? 'border-gray-900 scale-110' : 'border-gray-300'}`, style: { backgroundColor: colorOption } }, colorOption))) })] })] })] })] }) }), _jsxs("div", { className: "bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse", children: [_jsx("button", { type: "submit", className: `w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 ${themeClasses.bg} text-base font-medium text-white ${themeClasses.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.ring} sm:ml-3 sm:w-auto sm:text-sm`, children: "Create Folder" }), _jsx("button", { type: "button", onClick: onCancel, className: "mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm", children: "Cancel" })] })] }) })] }) }));
}
function EditFolderDialog({ folder, onSubmit, onCancel, themeClasses }) {
    const [name, setName] = useState(folder.name);
    const [color, setColor] = useState(folder.color || '#6B7280');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(folder.id, name.trim(), color);
        }
    };
    const colorOptions = [
        '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
        '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#84CC16'
    ];
    return (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0", children: [_jsx("div", { className: "fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75", onClick: onCancel }), _jsx("div", { className: "inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full", children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("div", { className: "bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4", children: _jsxs("div", { className: "sm:flex sm:items-start", children: [_jsx("div", { className: `mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${themeClasses.bg}/10 sm:mx-0 sm:h-10 sm:w-10`, children: _jsx(Edit2, { className: `h-6 w-6 ${themeClasses.text}` }) }), _jsxs("div", { className: "mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1", children: [_jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900 mb-4", children: "Edit Folder" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Folder Name" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "Enter folder name", className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent`, autoFocus: true, required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Color" }), _jsx("div", { className: "flex flex-wrap gap-2", children: colorOptions.map((colorOption) => (_jsx("button", { type: "button", onClick: () => setColor(colorOption), className: `w-8 h-8 rounded-full border-2 transition-all ${color === colorOption ? 'border-gray-900 scale-110' : 'border-gray-300'}`, style: { backgroundColor: colorOption } }, colorOption))) })] })] })] })] }) }), _jsxs("div", { className: "bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse", children: [_jsx("button", { type: "submit", className: `w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 ${themeClasses.bg} text-base font-medium text-white ${themeClasses.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.ring} sm:ml-3 sm:w-auto sm:text-sm`, children: "Update Folder" }), _jsx("button", { type: "button", onClick: onCancel, className: "mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm", children: "Cancel" })] })] }) })] }) }));
}
