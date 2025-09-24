import React, { useState, useRef, useEffect } from 'react';
import {
  Trash2,
  FolderOpen,
  FolderPlus,
  Copy,
  X,
  ChevronDown,
} from 'lucide-react';

export interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

export interface BulkActionBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Available folders for moving items */
  folders: Folder[];
  /** Repository type for theming */
  repositoryType: 'wods' | 'blocks';
  /** Callback when clear selection is clicked */
  onClearSelection: () => void;
  /** Callback when delete selected is clicked */
  onDeleteSelected: () => void;
  /** Callback when copy selected is clicked */
  onCopySelected: () => void;
  /** Callback when move to existing folder is selected */
  onMoveToFolder: (folderId: string) => void;
  /** Callback when create new folder and move is selected */
  onCreateFolderAndMove: () => void;
  /** Additional CSS classes */
  className?: string;
}

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
export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  folders,
  repositoryType,
  onClearSelection,
  onDeleteSelected,
  onCopySelected,
  onMoveToFolder,
  onCreateFolderAndMove,
  className = '',
}) => {
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleFolderSelect = (folderId: string) => {
    onMoveToFolder(folderId);
    setShowFolderDropdown(false);
  };

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 transform -translate-x-1/2
        ${theme.background}
        border rounded-lg shadow-lg p-4 z-50
        flex items-center gap-4
        min-w-96 max-w-4xl
        ${className}
      `}
    >
      {/* Selection Count */}
      <div className={`flex items-center gap-2 ${theme.text} font-medium`}>
        <span>{selectedCount} item{selectedCount !== 1 ? 's' : ''} selected</span>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-300" />

      {/* Move to Folder Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowFolderDropdown(!showFolderDropdown)}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${theme.buttonSecondary}`}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          <span>Move to folder</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </button>
        
        {showFolderDropdown && (
          <div className="absolute bottom-full mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="py-1">
              <button
                onClick={() => handleFolderSelect('root')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
              >
                <span>🗂️ Root (No folder)</span>
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderSelect(folder.id)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <span>🗂️ {folder.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create New Folder and Move */}
      <button
        onClick={onCreateFolderAndMove}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${theme.buttonSecondary}`}
      >
        <FolderPlus className="mr-2 h-4 w-4" />
        New Folder
      </button>

      {/* Copy */}
      <button
        onClick={onCopySelected}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${theme.buttonSecondary}`}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </button>

      {/* Delete */}
      <button
        onClick={onDeleteSelected}
        className="flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-300" />

      {/* Clear Selection */}
      <button
        onClick={onClearSelection}
        className="flex items-center p-2 text-gray-500 hover:text-gray-700 transition-colors"
        title="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default BulkActionBar;