import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProgramIndexBuilder } from './components/program-builder/ProgramIndexBuilder';
import { ProgramPreview } from './components/program-builder/ProgramPreview';
import { RepositoryPopup } from './components/RepositoryPopup';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';
export function ProgramBuilder() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const isEditing = Boolean(id);
    // Core state
    const [programData, setProgramData] = useState({
        title: 'New Program',
        description: '',
        status: 'draft',
        sections: [
            {
                id: 'section-1',
                title: 'Introduction',
                order: 1,
                isExpanded: true,
                subsections: []
            }
        ],
        settings: {
            difficulty: 'beginner',
            estimatedDurationWeeks: 8,
            programType: 'strength',
            tags: []
        }
    });
    const [currentSubsectionId, setCurrentSubsectionId] = useState(null);
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    // Repository popup state
    const [repositoryPopup, setRepositoryPopup] = useState({ type: 'wods', isOpen: false, subsectionId: null });
    // Load program data when editing
    useEffect(() => {
        if (isEditing && id) {
            loadProgramData(id);
        }
    }, [isEditing, id]);
    const loadProgramData = async (programId) => {
        try {
            setLoading(true);
            // Get current user session for authentication
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('User not authenticated');
            }
            // Load from programs API
            const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co';
            const apiUrl = `${supabaseUrl}/functions/v1/programs-api?id=${programId}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Failed to load program: ${response.status}`);
            }
            const data = await response.json();
            const program = data.data;
            if (!program) {
                throw new Error('Program not found');
            }
            // Transform API data to frontend format
            const transformedProgram = {
                id: program.id,
                title: program.title,
                description: program.description || '',
                status: program.status,
                sections: program.sections || [
                    {
                        id: 'section-1',
                        title: 'Introduction',
                        order: 1,
                        isExpanded: true,
                        subsections: []
                    }
                ],
                settings: {
                    difficulty: program.difficulty_level || 'beginner',
                    estimatedDurationWeeks: program.estimated_duration_weeks || 8,
                    programType: program.program_type || 'strength',
                    tags: program.tags || []
                }
            };
            setProgramData(transformedProgram);
        }
        catch (err) {
            setError('Failed to load program data');
            console.error('Load error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const saveProgramData = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);
            // Get current user session for authentication
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('User not authenticated. Please log in and try again.');
            }
            // Prepare data for API
            const apiData = {
                title: programData.title,
                description: programData.description,
                status: programData.status,
                difficulty_level: programData.settings.difficulty,
                estimated_duration_weeks: programData.settings.estimatedDurationWeeks,
                program_type: programData.settings.programType,
                tags: programData.settings.tags,
                sections: programData.sections,
                settings: programData.settings
            };
            const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co';
            const method = isEditing ? 'PUT' : 'POST';
            const apiUrl = isEditing
                ? `${supabaseUrl}/functions/v1/programs-api?id=${id}`
                : `${supabaseUrl}/functions/v1/programs-api`;
            const response = await fetch(apiUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA'
                },
                body: JSON.stringify(apiData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Failed to save program: ${response.status}`);
            }
            const data = await response.json();
            // If creating new program, redirect to edit mode
            if (!isEditing && data?.data?.id) {
                navigate(`/program-builder?id=${data.data.id}`);
            }
            // Success feedback
            setSuccessMessage('Program saved successfully!');
            // Auto-clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save program';
            setError(errorMessage);
            console.error('Save error:', errorMessage);
        }
        finally {
            setSaving(false);
        }
    };
    const handleBackToRepository = () => {
        navigate('/training-zone/programs');
    };
    const handleAssignContent = (subsectionId, contentType) => {
        setRepositoryPopup({
            type: contentType,
            isOpen: true,
            subsectionId
        });
    };
    const handleContentSelect = (contentItem) => {
        if (!repositoryPopup.subsectionId)
            return;
        setProgramData(prev => ({
            ...prev,
            sections: prev.sections.map(section => ({
                ...section,
                subsections: section.subsections.map(subsection => subsection.id === repositoryPopup.subsectionId
                    ? {
                        ...subsection,
                        assignedContent: {
                            type: repositoryPopup.type,
                            id: contentItem.id,
                            title: contentItem.title,
                            thumbnail_url: contentItem.thumbnail_url,
                            description: contentItem.description
                        }
                    }
                    : subsection)
            }))
        }));
        setRepositoryPopup({ type: 'wods', isOpen: false, subsectionId: null });
    };
    const getCurrentSubsection = () => {
        if (!currentSubsectionId)
            return null;
        for (const section of programData.sections) {
            const subsection = section.subsections.find(sub => sub.id === currentSubsectionId);
            if (subsection)
                return subsection;
        }
        return null;
    };
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading Program Builder..." })] }) }) }));
    }
    return (_jsxs("div", { className: "h-screen bg-gray-50 flex flex-col overflow-hidden", children: [_jsx("div", { className: "bg-white border-b border-gray-200 px-6 py-4 shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: handleBackToRepository, className: "p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: isEditing ? 'Edit Program' : 'Create New Program' }), _jsx("p", { className: "text-sm text-gray-500", children: "Build hierarchical training programs with sections and subsections" })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [error && (_jsx("div", { className: "text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg", children: error })), successMessage && (_jsx("div", { className: "text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg", children: successMessage })), _jsx("button", { onClick: saveProgramData, disabled: saving, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: saving ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm", className: "mr-2" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "-ml-1 mr-2 h-4 w-4" }), "Save Program"] })) })] })] }) }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsxs("div", { className: "w-1/2 bg-white border-r border-gray-200 flex flex-col", children: [_jsxs("div", { className: "border-b border-gray-200 px-6 py-4", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Program Structure" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Create sections and subsections to organize your training program" })] }), _jsx(ProgramIndexBuilder, { programData: programData, setProgramData: setProgramData, onAssignContent: handleAssignContent, onSubsectionSelect: setCurrentSubsectionId, selectedSubsectionId: currentSubsectionId })] }), _jsxs("div", { className: "w-1/2 bg-gray-50 flex flex-col", children: [_jsxs("div", { className: "border-b border-gray-200 bg-white px-6 py-4", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Preview" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Navigate through subsections with assigned content" })] }), _jsx(ProgramPreview, { programData: programData, currentSubsectionId: currentSubsectionId, onSubsectionSelect: setCurrentSubsectionId })] })] }), repositoryPopup.isOpen && (_jsx(RepositoryPopup, { contentType: repositoryPopup.type, onContentSelect: handleContentSelect, onClose: () => setRepositoryPopup({ type: 'wods', isOpen: false, subsectionId: null }) }))] }));
}
export default ProgramBuilder;
