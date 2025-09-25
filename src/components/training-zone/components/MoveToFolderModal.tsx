import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  ChevronDown,
  X,
} from 'lucide-react';

export interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

export interface MoveToFolderModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should be closed */
  onClose: () => void;
  /** Callback when folder is selected for moving */
  onMoveToFolder: (folderId: string | null) => Promise<void>;
  /** Available folders for selection */
  folders: Folder[];
  /** Repository type for theming */
  repositoryType: 'wods' | 'blocks';
  /** Whether moving is in progress */
  isMoving?: boolean;
  /** Item name being moved */
  itemName?: string;
}

/**
 * MoveToFolderModal - Modal dialog for selecting a folder to move an item to
 */
export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  isOpen,
  onClose,
  onMoveToFolder,
  folders,
  repositoryType,
  isMoving = false,
  itemName = 'item',
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    } catch (error) {
      console.error('Error moving item:', error);
    }
  };

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Move to Folder</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isMoving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Select a folder to move "{itemName}" to:
          </p>

          {/* Folder Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Destination Folder
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between ${theme.focus} transition-colors`}
                disabled={isMoving}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>
                    {selectedFolder ? selectedFolder.name : 'Root (No folder)'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFolderId(null);
                        setShowDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <FolderOpen className="h-4 w-4" />
                      Root (No folder)
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => {
                          setSelectedFolderId(folder.id);
                          setShowDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <FolderOpen className="h-4 w-4" />
                        {folder.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isMoving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMove}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme.primary} disabled:opacity-50`}
              disabled={isMoving}
            >
              {isMoving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Moving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Move
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveToFolderModal;