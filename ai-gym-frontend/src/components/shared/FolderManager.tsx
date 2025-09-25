import React, { useState, useEffect } from 'react'
import { ChevronRight, Folder, FolderPlus, Home, Search, Edit2, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Folder {
  id: string
  name: string
  parent_folder_id?: string | null
  repository_type: 'wods' | 'blocks'
  color?: string
  path?: string
  depth?: number
  created_at: string
  updated_at: string
}

interface FolderManagerProps {
  repositoryType: 'wods' | 'blocks'
  currentFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  onFolderCreate: (folderData: Partial<Folder>) => void
  onFolderUpdate: (folderId: string, folderData: Partial<Folder>) => void
  onFolderDelete: (folderId: string) => void
  themeColor: 'orange' | 'blue'
  className?: string
}

export function FolderManager({
  repositoryType,
  currentFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderUpdate,
  onFolderDelete,
  themeColor,
  className = ''
}: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

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
  }[themeColor]

  useEffect(() => {
    fetchFolders()
  }, [repositoryType])

  const fetchFolders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('folders-api', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Error fetching folders:', error)
        return
      }

      // Filter folders by repository type and build hierarchy
      const repositoryFolders = (data?.data || []).filter(
        (folder: Folder) => folder.repository_type === repositoryType
      )
      
      setFolders(repositoryFolders)
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async (name: string, parentId: string | null = null, color: string = '#6B7280') => {
    try {
      const folderData = {
        name,
        parent_folder_id: parentId,
        repository_type: repositoryType,
        color
      }
      
      onFolderCreate(folderData)
      setShowCreateDialog(false)
      await fetchFolders() // Refresh folders list
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const handleUpdateFolder = async (folderId: string, name: string, color: string) => {
    try {
      onFolderUpdate(folderId, { name, color })
      setEditingFolder(null)
      await fetchFolders() // Refresh folders list
    } catch (error) {
      console.error('Error updating folder:', error)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder? All contents will be moved to the parent folder.')) {
      try {
        onFolderDelete(folderId)
        await fetchFolders() // Refresh folders list
      } catch (error) {
        console.error('Error deleting folder:', error)
      }
    }
  }

  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const buildFolderTree = (folders: Folder[], parentId: string | null = null): Folder[] => {
    return folders
      .filter(folder => folder.parent_folder_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const hasChildren = folders.some(f => f.parent_folder_id === folder.id)
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = currentFolderId === folder.id
    const children = buildFolderTree(folders, folder.id)

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center space-x-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
            isSelected ? `${themeClasses.light} ${themeClasses.text}` : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onFolderSelect(folder.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolderExpansion(folder.id)
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`} />
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <Folder 
            className="h-4 w-4 flex-shrink-0" 
            style={{ color: folder.color || '#6B7280' }}
          />
          
          <span className="flex-1 text-sm truncate">{folder.name}</span>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setEditingFolder(folder)
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteFolder(folder.id)
              }}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {children.map(childFolder => renderFolder(childFolder, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const rootFolders = buildFolderTree(filteredFolders, null)

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Folders</h3>
        <button
          onClick={() => setShowCreateDialog(true)}
          className={`inline-flex items-center px-3 py-1.5 ${themeClasses.bg} text-white text-sm rounded-lg ${themeClasses.hover} transition-colors`}
        >
          <FolderPlus className="h-4 w-4 mr-1" />
          New Folder
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent text-sm`}
        />
      </div>

      {/* Folder Tree */}
      <div className="space-y-1">
        {/* Root Level */}
        <div
          onClick={() => onFolderSelect(null)}
          className={`flex items-center space-x-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
            currentFolderId === null ? `${themeClasses.light} ${themeClasses.text}` : 'text-gray-700'
          }`}
        >
          <Home className="h-4 w-4" />
          <span className="text-sm">All {repositoryType.toUpperCase()}</span>
        </div>
        
        {/* Folder Hierarchy */}
        {loading ? (
          <div className="text-center py-4 text-sm text-gray-500">Loading folders...</div>
        ) : (
          <div className="space-y-1">
            {rootFolders.map(folder => renderFolder(folder))}
            {rootFolders.length === 0 && !loading && (
              <div className="text-center py-4 text-sm text-gray-500">
                No folders yet. Create your first folder!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      {showCreateDialog && (
        <CreateFolderDialog
          onSubmit={handleCreateFolder}
          onCancel={() => setShowCreateDialog(false)}
          themeClasses={themeClasses}
          parentFolders={folders}
        />
      )}

      {/* Edit Folder Dialog */}
      {editingFolder && (
        <EditFolderDialog
          folder={editingFolder}
          onSubmit={handleUpdateFolder}
          onCancel={() => setEditingFolder(null)}
          themeClasses={themeClasses}
        />
      )}
    </div>
  )
}

// Create Folder Dialog Component
interface CreateFolderDialogProps {
  onSubmit: (name: string, parentId: string | null, color: string) => void
  onCancel: () => void
  themeClasses: any
  parentFolders: Folder[]
}

function CreateFolderDialog({ onSubmit, onCancel, themeClasses, parentFolders }: CreateFolderDialogProps) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [color, setColor] = useState('#6B7280')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim(), parentId, color)
    }
  }

  const colorOptions = [
    '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#84CC16'
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onCancel} />
        
        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${themeClasses.bg}/10 sm:mx-0 sm:h-10 sm:w-10`}>
                  <FolderPlus className={`h-6 w-6 ${themeClasses.text}`} />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Create New Folder
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Folder Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter folder name"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent`}
                        autoFocus
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Folder
                      </label>
                      <select
                        value={parentId || ''}
                        onChange={(e) => setParentId(e.target.value || null)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent`}
                      >
                        <option value="">Root level (no parent)</option>
                        {parentFolders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.path || folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((colorOption) => (
                          <button
                            key={colorOption}
                            type="button"
                            onClick={() => setColor(colorOption)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              color === colorOption ? 'border-gray-900 scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: colorOption }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 ${themeClasses.bg} text-base font-medium text-white ${themeClasses.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.ring} sm:ml-3 sm:w-auto sm:text-sm`}
              >
                Create Folder
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Folder Dialog Component
interface EditFolderDialogProps {
  folder: Folder
  onSubmit: (folderId: string, name: string, color: string) => void
  onCancel: () => void
  themeClasses: any
}

function EditFolderDialog({ folder, onSubmit, onCancel, themeClasses }: EditFolderDialogProps) {
  const [name, setName] = useState(folder.name)
  const [color, setColor] = useState(folder.color || '#6B7280')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(folder.id, name.trim(), color)
    }
  }

  const colorOptions = [
    '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#84CC16'
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onCancel} />
        
        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${themeClasses.bg}/10 sm:mx-0 sm:h-10 sm:w-10`}>
                  <Edit2 className={`h-6 w-6 ${themeClasses.text}`} />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Edit Folder
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Folder Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter folder name"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent`}
                        autoFocus
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((colorOption) => (
                          <button
                            key={colorOption}
                            type="button"
                            onClick={() => setColor(colorOption)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              color === colorOption ? 'border-gray-900 scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: colorOption }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 ${themeClasses.bg} text-base font-medium text-white ${themeClasses.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.ring} sm:ml-3 sm:w-auto sm:text-sm`}
              >
                Update Folder
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}