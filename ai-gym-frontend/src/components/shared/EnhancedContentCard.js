import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Star, StarOff } from 'lucide-react';
import { QuickActions } from './ContextMenu';
export function EnhancedContentCard({ item, isSelected, onSelect, onClick, onCopy, onMove, onDelete, onToggleFavorite, viewMode, themeColor, repositoryType, getStatusBadge, getDifficultyBadge, formatDate, formatDuration }) {
    const [isHovered, setIsHovered] = useState(false);
    const themeClasses = {
        orange: {
            hover: 'hover:text-orange-600',
            checkbox: 'text-orange-600 focus:ring-orange-500',
            star: 'text-orange-500',
            gradient: 'from-orange-400 to-orange-600'
        },
        blue: {
            hover: 'hover:text-blue-600',
            checkbox: 'text-blue-600 focus:ring-blue-500',
            star: 'text-blue-500',
            gradient: 'from-blue-400 to-blue-600'
        }
    }[themeColor];
    const handleCheckboxChange = (e) => {
        e.stopPropagation();
        onSelect(item.id, e.target.checked);
    };
    const handleStarClick = (e) => {
        e.stopPropagation();
        onToggleFavorite(item.id);
    };
    const handleCardClick = () => {
        onClick(item.id);
    };
    return (_jsxs("div", { onClick: handleCardClick, onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), className: `cursor-pointer group transition-all relative ${viewMode === 'cards'
            ? 'border border-gray-200 rounded-lg overflow-hidden hover:shadow-md bg-white'
            : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white'} ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}`, children: [_jsx("div", { className: `absolute ${viewMode === 'cards' ? 'top-2 left-2' : 'left-2 top-1/2 transform -translate-y-1/2'} z-10`, children: _jsx("input", { type: "checkbox", checked: isSelected, onChange: handleCheckboxChange, className: `h-4 w-4 rounded border-gray-300 ${themeClasses.checkbox} focus:ring-2 focus:ring-offset-2` }) }), _jsx("button", { onClick: handleStarClick, className: `absolute ${viewMode === 'cards' ? 'top-2 right-10' : 'right-10 top-1/2 transform -translate-y-1/2'} z-10 p-1 rounded-full hover:bg-white/80 transition-colors`, children: item.is_favorited ? (_jsx(Star, { className: `h-4 w-4 ${themeClasses.star} fill-current` })) : (_jsx(StarOff, { className: "h-4 w-4 text-gray-400 hover:text-gray-600" })) }), _jsx("div", { className: `absolute ${viewMode === 'cards' ? 'top-2 right-2' : 'right-2 top-1/2 transform -translate-y-1/2'} z-10`, children: _jsx(QuickActions, { onCopy: () => onCopy(item.id), onMove: () => onMove(item.id), onDelete: () => onDelete(item.id), onEdit: () => onClick(item.id), onView: () => window.open(`/page-builder?repo=${repositoryType}&id=${item.id}`, '_blank'), isFavorited: item.is_favorited || false, onToggleFavorite: () => onToggleFavorite(item.id) }) }), viewMode === 'cards' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "aspect-video bg-gray-200 relative overflow-hidden", children: [item.thumbnail_url ? (_jsx("img", { src: item.thumbnail_url, alt: item.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" })) : (_jsx("div", { className: `w-full h-full bg-gradient-to-br ${themeClasses.gradient} flex items-center justify-center`, children: _jsx("div", { className: "text-white text-lg font-bold", children: repositoryType === 'wods' ? 'WOD' : 'BLOCK' }) })), _jsx("div", { className: "absolute bottom-2 right-2 flex space-x-1", children: getStatusBadge(item.status) })] }), _jsxs("div", { className: "p-4 pt-8", children: [" ", _jsx("h3", { className: `font-semibold text-gray-900 group-hover:${themeClasses.hover} transition-colors line-clamp-2`, children: item.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1 line-clamp-2", children: item.description || 'No description provided' }), _jsxs("div", { className: "flex items-center justify-between mt-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [item.difficulty_level && getDifficultyBadge && getDifficultyBadge(item.difficulty_level), item.estimated_duration_minutes && (_jsx("span", { className: "inline-flex items-center text-xs text-gray-500", children: formatDuration(item.estimated_duration_minutes) }))] }), _jsx("span", { className: "text-xs text-gray-500", children: formatDate(item.updated_at) })] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 ml-6", children: [" ", item.thumbnail_url ? (_jsx("img", { src: item.thumbnail_url, alt: item.title, className: "w-full h-full object-cover rounded-lg" })) : (_jsx("div", { className: `w-full h-full bg-gradient-to-br ${themeClasses.gradient} rounded-lg flex items-center justify-center`, children: _jsx("div", { className: "text-white text-xs font-bold", children: repositoryType.toUpperCase() }) }))] }), _jsxs("div", { className: "flex-1 min-w-0 pr-16", children: [" ", _jsx("h3", { className: `font-semibold text-gray-900 truncate group-hover:${themeClasses.hover} transition-colors`, children: item.title }), _jsx("p", { className: "text-sm text-gray-600 truncate", children: item.description || 'No description provided' }), _jsxs("div", { className: "flex items-center space-x-3 mt-2", children: [getStatusBadge(item.status), item.difficulty_level && getDifficultyBadge && getDifficultyBadge(item.difficulty_level), item.estimated_duration_minutes && (_jsx("span", { className: "inline-flex items-center text-xs text-gray-500", children: formatDuration(item.estimated_duration_minutes) })), _jsxs("span", { className: "text-xs text-gray-500", children: ["Updated ", formatDate(item.updated_at)] })] })] })] }))] }));
}
