import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderPlus,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';

export interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

export interface FolderCreateModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should be closed */
  onClose: () => void;
  /** Callback when folder is created */
  onCreateFolder: (name: string, parentFolderId: string | null) => Promise<void>;
  /** Available folders for selecting parent */
  folders: Folder[];
  /** Repository type for theming */
  repositoryType: 'wods' | 'blocks';
  /** Whether creation is in progress */
  isCreating?: boolean;
  /** Error message to display */
  error?: string | null;
}

/**
 * FolderCreateModal - Modal dialog for creating new folders with parent selection
 * 
 * Features:
 * - Folder name input with validation
 * - Parent folder selection (optional)
 * - Error handling and loading states
 * - Theme-aware styling based on repository type
 * - Keyboard accessible
 */
export const FolderCreateModal: React.FC<FolderCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  folders,
  repositoryType,
  isCreating = false,
  error = null,
}) => {
  const [folderName, setFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showParentDropdown, setShowParentDropdown] = useState(false);

  // Theme colors based on repository type
  const themeColors = {
    wods: {
      primary: 'bg-orange-600 hover:bg-orange-700 text-white',
      secondary: 'border-orange-300 text-orange-700 hover:bg-orange-50',
      icon: 'text-orange-600',
      focus: 'focus:ring-orange-500 focus:border-orange-500',
    },
    blocks: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'border-blue-300 text-blue-700 hover:bg-blue-50',
      icon: 'text-blue-600',
      focus: 'focus:ring-blue-500 focus:border-blue-500',
    },
  };

  const theme = themeColors[repositoryType];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setParentFolderId(null);
      setValidationError(null);
      setShowParentDropdown(false);
    }
  }, [isOpen]);

  // Validate folder name
  const validateFolderName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Folder name is required';
    }
    if (name.trim().length < 2) {
      return 'Folder name must be at least 2 characters';
    }
    if (name.trim().length > 50) {
      return 'Folder name must be less than 50 characters';
    }
    // Check for duplicate names in the same parent folder
    const duplicateExists = folders.some(
      folder => 
        folder.name.toLowerCase() === name.trim().toLowerCase() &&
        folder.parent_folder_id === parentFolderId
    );
    if (duplicateExists) {
      return 'A folder with this name already exists in the selected location';
    }
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateFolderName(folderName);
    if (validation) {
      setValidationError(validation);
      return;
    }

    try {
      await onCreateFolder(folderName.trim(), parentFolderId);
      onClose();
    } catch (err) {
      // Error will be handled by parent component via error prop
    }
  };

  // Handle input change with validation
  const handleNameChange = (value: string) => {
    setFolderName(value);
    if (validationError) {
      const validation = validateFolderName(value);
      setValidationError(validation);
    }
  };

  // Get selected parent folder
  const selectedParent = folders.find(f => f.id === parentFolderId);

  const displayError = error || validationError;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FolderPlus className={`h-5 w-5 ${theme.icon}`} />
            <h2 className="text-lg font-semibold text-gray-900">Create New Folder</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isCreating}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Create a new folder to organize your {repositoryType === 'wods' ? 'WODs' : 'workout blocks'}.
          </p>

          {/* Folder Name Input */}
          <div>
            <label htmlFor="folder-name" className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name
            </label>
            <input
              id="folder-name"
              type="text"
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors ${
                theme.focus
              } ${displayError ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isCreating}
              autoFocus
            />
          </div>

          {/* Parent Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Folder (Optional)
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowParentDropdown(!showParentDropdown)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between ${theme.focus} transition-colors`}
                disabled={isCreating}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span>
                    {selectedParent ? selectedParent.name : 'Root (No parent)'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showParentDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setParentFolderId(null);
                        setShowParentDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Folder className="h-4 w-4" />
                      Root (No parent)
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => {
                          setParentFolderId(folder.id);
                          setShowParentDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Folder className="h-4 w-4" />
                        {folder.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {displayError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme.primary} disabled:opacity-50`}
              disabled={isCreating || !folderName.trim()}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Create Folder
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderCreateModal;