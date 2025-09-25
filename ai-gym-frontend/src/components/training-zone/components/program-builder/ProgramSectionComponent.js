import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ProgramSubsectionComponent } from './ProgramSubsectionComponent';
import { ChevronDown, ChevronRight, MoreVertical, Edit2, Trash2, ArrowUp, ArrowDown, Plus, GripVertical } from 'lucide-react';
export function ProgramSectionComponent({ section, onUpdate, onDelete, onMove, onAddSubsection, onUpdateSubsection, onDeleteSubsection, onMoveSubsection, onAssignContent, onSubsectionSelect, selectedSubsectionId, canMoveUp, canMoveDown }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(section.title);
    const [showMenu, setShowMenu] = useState(false);
    const handleTitleSave = () => {
        onUpdate({ title: editTitle });
        setIsEditing(false);
    };
    const handleTitleCancel = () => {
        setEditTitle(section.title);
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
    const toggleExpanded = () => {
        onUpdate({ isExpanded: !section.isExpanded });
    };
    return (_jsxs("div", { className: "border border-gray-200 rounded-lg bg-white", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-100", children: [_jsxs("div", { className: "flex items-center space-x-3 flex-1", children: [_jsx("div", { className: "text-gray-400 hover:text-gray-600 cursor-move", children: _jsx(GripVertical, { className: "h-4 w-4" }) }), _jsx("button", { onClick: toggleExpanded, className: "text-gray-400 hover:text-gray-600 transition-colors", children: section.isExpanded ? (_jsx(ChevronDown, { className: "h-4 w-4" })) : (_jsx(ChevronRight, { className: "h-4 w-4" })) }), _jsx("span", { className: "text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded", children: section.order }), _jsx("div", { className: "flex-1", children: isEditing ? (_jsx("input", { type: "text", value: editTitle, onChange: (e) => setEditTitle(e.target.value), onBlur: handleTitleSave, onKeyDown: handleKeyPress, className: "w-full text-lg font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white rounded px-2 py-1", autoFocus: true })) : (_jsx("h3", { className: "text-lg font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors", onClick: () => setIsEditing(true), children: section.title })) })] }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowMenu(!showMenu), className: "p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors", children: _jsx(MoreVertical, { className: "h-4 w-4" }) }), showMenu && (_jsxs("div", { className: "absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10", children: [_jsxs("button", { onClick: () => {
                                            setIsEditing(true);
                                            setShowMenu(false);
                                        }, className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2", children: [_jsx(Edit2, { className: "h-4 w-4" }), _jsx("span", { children: "Edit Title" })] }), canMoveUp && (_jsxs("button", { onClick: () => {
                                            onMove('up');
                                            setShowMenu(false);
                                        }, className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2", children: [_jsx(ArrowUp, { className: "h-4 w-4" }), _jsx("span", { children: "Move Up" })] })), canMoveDown && (_jsxs("button", { onClick: () => {
                                            onMove('down');
                                            setShowMenu(false);
                                        }, className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2", children: [_jsx(ArrowDown, { className: "h-4 w-4" }), _jsx("span", { children: "Move Down" })] })), _jsx("hr", { className: "my-1" }), _jsxs("button", { onClick: () => {
                                            onDelete();
                                            setShowMenu(false);
                                        }, className: "w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2", children: [_jsx(Trash2, { className: "h-4 w-4" }), _jsx("span", { children: "Delete Section" })] })] })), showMenu && (_jsx("div", { className: "fixed inset-0 z-0", onClick: () => setShowMenu(false) }))] })] }), section.isExpanded && (_jsx("div", { className: "p-4", children: _jsxs("div", { className: "space-y-2", children: [section.subsections.map((subsection, index) => (_jsx(ProgramSubsectionComponent, { subsection: subsection, onUpdate: (updates) => onUpdateSubsection(subsection.id, updates), onDelete: () => onDeleteSubsection(subsection.id), onMove: (direction) => onMoveSubsection(subsection.id, direction), onAssignContent: onAssignContent, onSelect: () => onSubsectionSelect(subsection.id), isSelected: selectedSubsectionId === subsection.id, canMoveUp: index > 0, canMoveDown: index < section.subsections.length - 1 }, subsection.id))), _jsxs("button", { onClick: onAddSubsection, className: "w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors flex items-center justify-center space-x-2", children: [_jsx(Plus, { className: "h-4 w-4" }), _jsx("span", { children: "Add Subsection" })] })] }) }))] }));
}
export default ProgramSectionComponent;
