import React, { useState } from 'react'
import { ProgramSection, ProgramSubsection } from '../../ProgramBuilder'
import { ProgramSubsectionComponent } from './ProgramSubsectionComponent'
import { 
  ChevronDown, 
  ChevronRight, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Plus,
  GripVertical
} from 'lucide-react'

interface ProgramSectionComponentProps {
  section: ProgramSection
  onUpdate: (updates: Partial<ProgramSection>) => void
  onDelete: () => void
  onMove: (direction: 'up' | 'down') => void
  onAddSubsection: () => void
  onUpdateSubsection: (subsectionId: string, updates: Partial<ProgramSubsection>) => void
  onDeleteSubsection: (subsectionId: string) => void
  onMoveSubsection: (subsectionId: string, direction: 'up' | 'down') => void
  onAssignContent: (subsectionId: string, contentType: 'wods' | 'blocks') => void
  onSubsectionSelect: (subsectionId: string) => void
  selectedSubsectionId: string | null
  canMoveUp: boolean
  canMoveDown: boolean
}

export function ProgramSectionComponent({
  section,
  onUpdate,
  onDelete,
  onMove,
  onAddSubsection,
  onUpdateSubsection,
  onDeleteSubsection,
  onMoveSubsection,
  onAssignContent,
  onSubsectionSelect,
  selectedSubsectionId,
  canMoveUp,
  canMoveDown
}: ProgramSectionComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(section.title)
  const [showMenu, setShowMenu] = useState(false)

  const handleTitleSave = () => {
    onUpdate({ title: editTitle })
    setIsEditing(false)
  }

  const handleTitleCancel = () => {
    setEditTitle(section.title)
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }

  const toggleExpanded = () => {
    onUpdate({ isExpanded: !section.isExpanded })
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3 flex-1">
          {/* Drag Handle */}
          <div className="text-gray-400 hover:text-gray-600 cursor-move">
            <GripVertical className="h-4 w-4" />
          </div>
          
          {/* Expand/Collapse */}
          <button
            onClick={toggleExpanded}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {section.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {/* Section Number */}
          <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
            {section.order}
          </span>
          
          {/* Section Title */}
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleKeyPress}
                className="w-full text-lg font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white rounded px-2 py-1"
                autoFocus
              />
            ) : (
              <h3 
                className="text-lg font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                {section.title}
              </h3>
            )}
          </div>
        </div>
        
        {/* Section Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  setIsEditing(true)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Title</span>
              </button>
              
              {canMoveUp && (
                <button
                  onClick={() => {
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
                  onClick={() => {
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
                onClick={() => {
                  onDelete()
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Section</span>
              </button>
            </div>
          )}
          
          {/* Backdrop to close menu */}
          {showMenu && (
            <div 
              className="fixed inset-0 z-0" 
              onClick={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>
      
      {/* Section Content */}
      {section.isExpanded && (
        <div className="p-4">
          {/* Subsections */}
          <div className="space-y-2">
            {section.subsections.map((subsection, index) => (
              <ProgramSubsectionComponent
                key={subsection.id}
                subsection={subsection}
                onUpdate={(updates) => onUpdateSubsection(subsection.id, updates)}
                onDelete={() => onDeleteSubsection(subsection.id)}
                onMove={(direction) => onMoveSubsection(subsection.id, direction)}
                onAssignContent={onAssignContent}
                onSelect={() => onSubsectionSelect(subsection.id)}
                isSelected={selectedSubsectionId === subsection.id}
                canMoveUp={index > 0}
                canMoveDown={index < section.subsections.length - 1}
              />
            ))}
            
            {/* Add Subsection Button */}
            <button
              onClick={onAddSubsection}
              className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Subsection</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgramSectionComponent