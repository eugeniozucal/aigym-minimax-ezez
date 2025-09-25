import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ProgramSectionComponent } from './ProgramSectionComponent';
import { Plus } from 'lucide-react';
export function ProgramIndexBuilder({ programData, setProgramData, onAssignContent, onSubsectionSelect, selectedSubsectionId }) {
    const addSection = () => {
        const newSection = {
            id: `section-${Date.now()}`,
            title: `Section ${programData.sections.length + 1}`,
            order: programData.sections.length + 1,
            isExpanded: true,
            subsections: []
        };
        setProgramData({
            ...programData,
            sections: [...programData.sections, newSection]
        });
    };
    const updateSection = (sectionId, updates) => {
        setProgramData({
            ...programData,
            sections: programData.sections.map(section => section.id === sectionId ? { ...section, ...updates } : section)
        });
    };
    const deleteSection = (sectionId) => {
        const updatedSections = programData.sections
            .filter(section => section.id !== sectionId)
            .map((section, index) => ({ ...section, order: index + 1 }));
        setProgramData({
            ...programData,
            sections: updatedSections
        });
    };
    const moveSection = (sectionId, direction) => {
        const sectionIndex = programData.sections.findIndex(s => s.id === sectionId);
        if ((direction === 'up' && sectionIndex > 0) ||
            (direction === 'down' && sectionIndex < programData.sections.length - 1)) {
            const newSections = [...programData.sections];
            const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
            [newSections[sectionIndex], newSections[targetIndex]] =
                [newSections[targetIndex], newSections[sectionIndex]];
            // Update order
            newSections.forEach((section, index) => {
                section.order = index + 1;
            });
            setProgramData({
                ...programData,
                sections: newSections
            });
        }
    };
    const addSubsection = (sectionId) => {
        const section = programData.sections.find(s => s.id === sectionId);
        if (!section)
            return;
        const newSubsection = {
            id: `subsection-${Date.now()}`,
            title: `Subsection ${section.subsections.length + 1}`,
            order: section.subsections.length + 1,
            sectionId
        };
        updateSection(sectionId, {
            subsections: [...section.subsections, newSubsection]
        });
    };
    const updateSubsection = (subsectionId, updates) => {
        setProgramData({
            ...programData,
            sections: programData.sections.map(section => ({
                ...section,
                subsections: section.subsections.map(subsection => subsection.id === subsectionId ? { ...subsection, ...updates } : subsection)
            }))
        });
    };
    const deleteSubsection = (subsectionId) => {
        setProgramData({
            ...programData,
            sections: programData.sections.map(section => ({
                ...section,
                subsections: section.subsections
                    .filter(sub => sub.id !== subsectionId)
                    .map((sub, index) => ({ ...sub, order: index + 1 }))
            }))
        });
    };
    const moveSubsection = (subsectionId, direction) => {
        const section = programData.sections.find(s => s.subsections.some(sub => sub.id === subsectionId));
        if (!section)
            return;
        const subsectionIndex = section.subsections.findIndex(s => s.id === subsectionId);
        if ((direction === 'up' && subsectionIndex > 0) ||
            (direction === 'down' && subsectionIndex < section.subsections.length - 1)) {
            const newSubsections = [...section.subsections];
            const targetIndex = direction === 'up' ? subsectionIndex - 1 : subsectionIndex + 1;
            [newSubsections[subsectionIndex], newSubsections[targetIndex]] =
                [newSubsections[targetIndex], newSubsections[subsectionIndex]];
            // Update order
            newSubsections.forEach((subsection, index) => {
                subsection.order = index + 1;
            });
            updateSection(section.id, {
                subsections: newSubsections
            });
        }
    };
    return (_jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-100", children: [_jsx("input", { type: "text", value: programData.title, onChange: (e) => setProgramData({ ...programData, title: e.target.value }), className: "w-full text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white rounded px-2 py-1", placeholder: "Program Title" }), _jsx("textarea", { value: programData.description, onChange: (e) => setProgramData({ ...programData, description: e.target.value }), className: "w-full mt-2 text-sm text-gray-600 bg-transparent border-none outline-none resize-none focus:ring-2 focus:ring-purple-500 focus:bg-white rounded px-2 py-1", placeholder: "Program description...", rows: 2 })] }), _jsxs("div", { className: "p-6 space-y-4", children: [programData.sections.map((section) => (_jsx(ProgramSectionComponent, { section: section, onUpdate: (updates) => updateSection(section.id, updates), onDelete: () => deleteSection(section.id), onMove: (direction) => moveSection(section.id, direction), onAddSubsection: () => addSubsection(section.id), onUpdateSubsection: updateSubsection, onDeleteSubsection: deleteSubsection, onMoveSubsection: moveSubsection, onAssignContent: onAssignContent, onSubsectionSelect: onSubsectionSelect, selectedSubsectionId: selectedSubsectionId, canMoveUp: section.order > 1, canMoveDown: section.order < programData.sections.length }, section.id))), _jsxs("button", { onClick: addSection, className: "w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors flex items-center justify-center space-x-2", children: [_jsx(Plus, { className: "h-5 w-5" }), _jsx("span", { children: "Add Section" })] })] })] }));
}
export default ProgramIndexBuilder;
