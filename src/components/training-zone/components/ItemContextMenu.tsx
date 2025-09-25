import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Copy,
  Trash2,
  FolderOpen,
  Star,
  StarOff,
} from 'lucide-react';

export interface ItemContextMenuProps {
  /** Whether the item is currently favorited */
  isFavorited?: boolean;
  /** Repository type for theming */
  repositoryType: 'wods' | 'blocks';
  /** Callback when copy action is selected */
  onCopy: () => void;
  /** Callback when delete action is selected */
  onDelete: () => void;
  /** Callback when move to folder action is selected */
  onMoveToFolder: () => void;
  /** Callback when favorite toggle is selected */
  onToggleFavorite: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant for the trigger button */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ItemContextMenu - A reusable 3-dot context menu for WOD and BLOCK items
 * 
 * Features:
 * - Copy, Delete, Move to folder, and Toggle favorite actions
 * - Keyboard accessible
 * - Theme-aware styling based on repository type
 * - Configurable size variants
 */
export const ItemContextMenu: React.FC<ItemContextMenuProps> = ({
  isFavorited = false,
  repositoryType,
  onCopy,
  onDelete,
  onMoveToFolder,
  onToggleFavorite,
  className = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Theme colors based on repository type
  const themeColors = {
    wods: {
      trigger: 'hover:bg-orange-50 hover:text-orange-700',
      menuItem: 'hover:bg-orange-50 hover:text-orange-700',
      iconColor: 'text-orange-600',
    },
    blocks: {
      trigger: 'hover:bg-blue-50 hover:text-blue-700',
      menuItem: 'hover:bg-blue-50 hover:text-blue-700',
      iconColor: 'text-blue-600',
    },
  };

  // Size variants for the trigger button
  const sizeClasses = {
    sm: 'h-6 w-6 p-1',
    md: 'h-8 w-8 p-1.5',
    lg: 'h-10 w-10 p-2',
  };

  const theme = themeColors[repositoryType];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`
          ${sizeClasses[size]}
          rounded-md transition-colors
          ${theme.trigger}
          opacity-0 group-hover:opacity-100
          focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2
          ${repositoryType === 'wods' ? 'focus:ring-orange-500' : 'focus:ring-blue-500'}
          ${className}
        `}
        aria-label="More options"
      >
        <MoreVertical className="h-full w-full" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onCopy);
              }}
              className={`w-full px-4 py-2 text-left text-sm text-gray-700 ${theme.menuItem} transition-colors flex items-center`}
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onMoveToFolder);
              }}
              className={`w-full px-4 py-2 text-left text-sm text-gray-700 ${theme.menuItem} transition-colors flex items-center`}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>Move to folder</span>
            </button>
            
            <hr className="my-1 border-gray-200" />
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onToggleFavorite);
              }}
              className={`w-full px-4 py-2 text-left text-sm text-gray-700 ${theme.menuItem} transition-colors flex items-center`}
            >
              {isFavorited ? (
                <>
                  <StarOff className="mr-2 h-4 w-4" />
                  <span>Remove from favorites</span>
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  <span>Add to favorites</span>
                </>
              )}
            </button>
            
            <hr className="my-1 border-gray-200" />
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onDelete);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemContextMenu;