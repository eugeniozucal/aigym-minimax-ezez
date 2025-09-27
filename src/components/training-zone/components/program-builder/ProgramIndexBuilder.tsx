import React, { useState } from 'react'
import { ProgramData, ProgramSection, ProgramSubsection } from '../../ProgramBuilder'
import { ProgramSectionComponent } from './ProgramSectionComponent'
import { Plus } from 'lucide-react'

interface ProgramIndexBuilderProps {
  programData: ProgramData
  setProgramData: (data: ProgramData) => void
  onAssignContent: (subsectionId: string, contentType: 'wods' | 'blocks') => void
  onSubsectionSelect: (subsectionId: string) => void
  selectedSubsectionId: string | null
}

export function ProgramIndexBuilder({
  programData,
  setProgramData,
  onAssignContent,
  onSubsectionSelect,
  selectedSubsectionId
}: ProgramIndexBuilderProps) {
  
  const addSection = () => {
    const newSection: ProgramSection = {
      id: `section-${Date.now()}`,
      title: `Section ${programData.sections.length + 1}`,
      order: programData.sections.length + 1,
      isExpanded: true,
      subsections: []
    }
    
    setProgramData({
      ...programData,
      sections: [...programData.sections, newSection]
    })
  }

  const updateSection = (sectionId: string, updates: Partial<ProgramSection>) => {
    setProgramData({
      ...programData,
      sections: programData.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    })
  }

  const deleteSection = (sectionId: string) => {
    const updatedSections = programData.sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index + 1 }))
    
    setProgramData({
      ...programData,
      sections: updatedSections
    })
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sectionIndex = programData.sections.findIndex(s => s.id === sectionId)
    if (
      (direction === 'up' && sectionIndex > 0) ||
      (direction === 'down' && sectionIndex < programData.sections.length - 1)
    ) {
      const newSections = [...programData.sections]
      const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1
      
      // Swap sections
      ;[newSections[sectionIndex], newSections[targetIndex]] = 
        [newSections[targetIndex], newSections[sectionIndex]]
      
      // Update order
      newSections.forEach((section, index) => {
        section.order = index + 1
      })
      
      setProgramData({
        ...programData,
        sections: newSections
      })
    }
  }

  const addSubsection = (sectionId: string) => {
    const section = programData.sections.find(s => s.id === sectionId)
    if (!section) return
    
    const newSubsection: ProgramSubsection = {
      id: `subsection-${Date.now()}`,
      title: `Subsection ${section.subsections.length + 1}`,
      order: section.subsections.length + 1,
      sectionId
    }
    
    updateSection(sectionId, {
      subsections: [...section.subsections, newSubsection]
    })
  }

  const updateSubsection = (subsectionId: string, updates: Partial<ProgramSubsection>) => {
    setProgramData({
      ...programData,
      sections: programData.sections.map(section => ({
        ...section,
        subsections: section.subsections.map(subsection =>
          subsection.id === subsectionId ? { ...subsection, ...updates } : subsection
        )
      }))
    })
  }

  const deleteSubsection = (subsectionId: string) => {
    setProgramData({
      ...programData,
      sections: programData.sections.map(section => ({
        ...section,
        subsections: section.subsections
          .filter(sub => sub.id !== subsectionId)
          .map((sub, index) => ({ ...sub, order: index + 1 }))
      }))
    })
  }

  const moveSubsection = (subsectionId: string, direction: 'up' | 'down') => {
    const section = programData.sections.find(s => 
      s.subsections.some(sub => sub.id === subsectionId)
    )
    if (!section) return
    
    const subsectionIndex = section.subsections.findIndex(s => s.id === subsectionId)
    if (
      (direction === 'up' && subsectionIndex > 0) ||
      (direction === 'down' && subsectionIndex < section.subsections.length - 1)
    ) {
      const newSubsections = [...section.subsections]
      const targetIndex = direction === 'up' ? subsectionIndex - 1 : subsectionIndex + 1
      
      // Swap subsections
      ;[newSubsections[subsectionIndex], newSubsections[targetIndex]] = 
        [newSubsections[targetIndex], newSubsections[subsectionIndex]]
      
      // Update order
      newSubsections.forEach((subsection, index) => {
        subsection.order = index + 1
      })
      
      updateSection(section.id, {
        subsections: newSubsections
      })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Program Title */}
      <div className="px-6 py-4 border-b border-gray-100">
        <input
          type="text"
          value={programData.title}
          onChange={(e) => setProgramData({ ...programData, title: e.target.value })}
          className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white rounded px-2 py-1"
          placeholder="Program Title"
        />
        <textarea
          value={programData.description}
          onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
          className="w-full mt-2 text-sm text-gray-600 bg-transparent border-none outline-none resize-none focus:ring-2 focus:ring-purple-500 focus:bg-white rounded px-2 py-1"
          placeholder="Program description..."
          rows={2}
        />
      </div>

      {/* Sections */}
      <div className="p-6 space-y-4">
        {programData.sections.map((section) => (
          <ProgramSectionComponent
            key={section.id}
            section={section}
            onUpdate={(updates) => updateSection(section.id, updates)}
            onDelete={() => deleteSection(section.id)}
            onMove={(direction) => moveSection(section.id, direction)}
            onAddSubsection={() => addSubsection(section.id)}
            onUpdateSubsection={updateSubsection}
            onDeleteSubsection={deleteSubsection}
            onMoveSubsection={moveSubsection}
            onAssignContent={onAssignContent}
            onSubsectionSelect={onSubsectionSelect}
            selectedSubsectionId={selectedSubsectionId}
            canMoveUp={section.order > 1}
            canMoveDown={section.order < programData.sections.length}
          />
        ))}
        
        {/* Add Section Button */}
        <button
          onClick={addSection}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Section</span>
        </button>
      </div>
    </div>
  )
}

export default ProgramIndexBuilder