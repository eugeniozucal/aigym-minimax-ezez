import React, { useState } from 'react'
import { ProgramSubsection } from '../../ProgramBuilder'
import { 
  MoreVertical, 
  Edit2, 
  Link, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  GripVertical,
  Play,
  FileText,
  Calendar
} from 'lucide-react'

interface ProgramSubsectionComponentProps {
  subsection: ProgramSubsection
  onUpdate: (updates: Partial<ProgramSubsection>) => void
  onDelete: () => void
  onMove: (direction: 'up' | 'down') => void
  onAssignContent: (subsectionId: string, contentType: 'wods' | 'blocks') => void
  onSelect: () => void
  isSelected: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}

export function ProgramSubsectionComponent({
  subsection,
  onUpdate,
  onDelete,
  onMove,
  onAssignContent,
  onSelect,
  isSelected,
  canMoveUp,
  canMoveDown
}: ProgramSubsectionComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(subsection.title)
  const [showMenu, setShowMenu] = useState(false)
  const [showAssignMenu, setShowAssignMenu] = useState(false)

  const handleTitleSave = () => {
    onUpdate({ title: editTitle })
    setIsEditing(false)
  }

  const handleTitleCancel = () => {
    setEditTitle(subsection.title)
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }

  const handleAssign = (contentType: 'wods' | 'blocks') => {
    onAssignContent(subsection.id, contentType)
    setShowAssignMenu(false)
    setShowMenu(false)
  }

  const getContentIcon = (type: 'wods' | 'blocks') => {
    return type === 'wods' ? (
      <Calendar className="h-4 w-4" />
    ) : (
      <Play className="h-4 w-4" />
    )
  }

  const getContentColor = (type: 'wods' | 'blocks') => {
    return type === 'wods' ? 'text-orange-600' : 'text-blue-600'
  }

  return (
    <div 
      className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected 
          ? 'border-purple-300 bg-purple-50' 
          : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Drag Handle */}
        <div className="text-gray-400 hover:text-gray-600 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4" />
        </div>
        
        {/* Content Indicator */}
        {subsection.assignedContent && (
          <div className={`${getContentColor(subsection.assignedContent.type)}`}>
            {getContentIcon(subsection.assignedContent.type)}
          </div>
        )}
        
        {/* Subsection Title */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyPress}
              className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white rounded px-2 py-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">
                {subsection.title}
              </p>
              {subsection.assignedContent && (
                <p className="text-xs text-gray-500 truncate">
                  {subsection.assignedContent.type.toUpperCase()}: {subsection.assignedContent.title}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Three-dot Menu */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
                setShowMenu(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
            >
              <Edit2 className="h-4 w-4" />
              <span>Title</span>
            </button>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAssignMenu(!showAssignMenu)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Link className="h-4 w-4" />
                  <span>Assign</span>
                </div>
                <span className="text-xs text-gray-400">▶</span>
              </button>
              
              {showAssignMenu && (
                <div className="absolute left-full top-0 ml-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAssign('wods')
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span>WODs</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAssign('blocks')
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Play className="h-4 w-4 text-blue-600" />
                    <span>BLOCKS</span>
                  </button>
                </div>
              )}
            </div>
            
            {canMoveUp && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMove('up')
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <ArrowUp className="h-4 w-4" />
                <span>Move Up</span>
              </button>
            )}
            
            {canMoveDown && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMove('down')
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <ArrowDown className="h-4 w-4" />
                <span>Move Down</span>
              </button>
            )}
            
            <hr className="my-1" />
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
                setShowMenu(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
        
        {/* Backdrop to close menus */}
        {(showMenu || showAssignMenu) && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(false)
              setShowAssignMenu(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ProgramSubsectionComponent