import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { MoreVertical, Edit2, Link, Trash2, ArrowUp, ArrowDown, GripVertical, Play, Calendar } from 'lucide-react';
export function ProgramSubsectionComponent({ subsection, onUpdate, onDelete, onMove, onAssignContent, onSelect, isSelected, canMoveUp, canMoveDown }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(subsection.title);
    const [showMenu, setShowMenu] = useState(false);
    const [showAssignMenu, setShowAssignMenu] = useState(false);
    const handleTitleSave = () => {
        onUpdate({ title: editTitle });
        setIsEditing(false);
    };
    const handleTitleCancel = () => {
        setEditTitle(subsection.title);
        setIsEditing(false);
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleTitleSave();
        }
        else if (e.key === 'Escape') {
            handleTitleCancel();
        }
    };
    const handleAssign = (contentType) => {
        onAssignContent(subsection.id, contentType);
        setShowAssignMenu(false);
        setShowMenu(false);
    };
    const getContentIcon = (type) => {
        return type === 'wods' ? (_jsx(Calendar, { className: "h-4 w-4" })) : (_jsx(Play, { className: "h-4 w-4" }));
    };
    const getContentColor = (type) => {
        return type === 'wods' ? 'text-orange-600' : 'text-blue-600';
    };
    return (_jsxs("div", { className: `group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isSelected
            ? 'border-purple-300 bg-purple-50'
            : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'}`, onClick: onSelect, children: [_jsxs("div", { className: "flex items-center space-x-3 flex-1 min-w-0", children: [_jsx("div", { className: "text-gray-400 hover:text-gray-600 cursor-move opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripVertical, { className: "h-4 w-4" }) }), subsection.assignedContent && (_jsx("div", { className: `${getContentColor(subsection.assignedContent.type)}`, children: getContentIcon(subsection.assignedContent.type) })), _jsx("div", { className: "flex-1 min-w-0", children: isEditing ? (_jsx("input", { type: "text", value: editTitle, onChange: (e) => setEditTitle(e.target.value), onBlur: handleTitleSave, onKeyDown: handleKeyPress, className: "w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white rounded px-2 py-1", autoFocus: true, onClick: (e) => e.stopPropagation() })) : (_jsxs("div", { className: "truncate", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: subsection.title }), subsection.assignedContent && (_jsxs("p", { className: "text-xs text-gray-500 truncate", children: [subsection.assignedContent.type.toUpperCase(), ": ", subsection.assignedContent.title] }))] })) })] }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }, className: "p-1 text-gray-400 hover:text-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100", children: _jsx(MoreVertical, { className: "h-4 w-4" }) }), showMenu && (_jsxs("div", { className: "absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20", children: [_jsxs("button", { onClick: (e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                    setShowMenu(false);
                                }, className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2", children: [_jsx(Edit2, { className: "h-4 w-4" }), _jsx("span", { children: "Title" })] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            setShowAssignMenu(!showAssignMenu);
                                        }, className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Link, { className: "h-4 w-4" }), _jsx("span", { children: "Assign" })] }), _jsx("span", { className: "text-xs text-gray-400", children: "\u25B6" })] }), showAssignMenu && (_jsxs("div", { className: "absolute left-full top-0 ml-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1", children: [_jsxs("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleAssign('wods');
                                                }, className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-orange-600" }), _jsx("span", { children: "WODs" })] }), _jsxs("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleAssign('blocks');
                                                }, className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2", children: [_jsx(Play, { className: "h-4 w-4 text-blue-600" }), _jsx("span", { children: "BLOCKS" })] })] }))] }), canMoveUp && (_jsxs("button", { onClick: (e) => {
                                    e.stopPropagation();
                                    onMove('up');
                                    setShowMenu(false);
                                }, className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2", children: [_jsx(ArrowUp, { className: "h-4 w-4" }), _jsx("span", { children: "Move Up" })] })), canMoveDown && (_jsxs("button", { onClick: (e) => {
                                    e.stopPropagation();
                                    onMove('down');
                                    setShowMenu(false);
                                }, className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2", children: [_jsx(ArrowDown, { className: "h-4 w-4" }), _jsx("span", { children: "Move Down" })] })), _jsx("hr", { className: "my-1" }), _jsxs("button", { onClick: (e) => {
                                    e.stopPropagation();
                                    onDelete();
                                    setShowMenu(false);
                                }, className: "w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2", children: [_jsx(Trash2, { className: "h-4 w-4" }), _jsx("span", { children: "Delete" })] })] })), (showMenu || showAssignMenu) && (_jsx("div", { className: "fixed inset-0 z-10", onClick: (e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            setShowAssignMenu(false);
                        } }))] })] }));
}
export default ProgramSubsectionComponent;
