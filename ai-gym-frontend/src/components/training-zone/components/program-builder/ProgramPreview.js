import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, FileText, Loader2, Dumbbell, Package } from 'lucide-react';
import { BlockRenderer } from '../BlockRenderer';
import { supabase } from '@/lib/supabase';
export function ProgramPreview({ programData, currentSubsectionId, onSubsectionSelect }) {
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // FIXED FETCH FUNCTION WITH CORRECT TABLE MAPPING
    const fetchPageData = async (contentId, contentType) => {
        setLoading(true);
        setError(null);
        // Map content types to correct table names
        const tableMap = {
            'wods': 'wods',
            'blocks': 'workout_blocks' // FIX: blocks content is stored in workout_blocks table
        };
        const tableName = tableMap[contentType] || contentType;
        try {
            // Use direct database query with correct table name
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', contentId)
                .single();
            if (error) {
                console.error(`Error fetching ${contentType} from ${tableName}:`, error);
                setError(`Failed to load ${contentType} content`);
                setPageData(null);
                return;
            }
            // EXACT backend connection logic from PreviewModal.tsx - construct PageData format
            if (data) {
                const pageDataFormatted = {
                    title: data.title,
                    description: data.description || '',
                    targetRepository: contentType,
                    status: data.status || 'draft',
                    pages: data.pages || [],
                    settings: data.settings || {}
                };
                setPageData(pageDataFormatted);
            }
            else {
                setError(`No content found for ${contentType}`);
                setPageData(null);
            }
        }
        catch (error) {
            console.error(`Error fetching ${contentType} from ${tableName}:`, error);
            setError(`Failed to load ${contentType} content`);
            setPageData(null);
        }
        finally {
            setLoading(false);
        }
    };
    // EXACT EFFECT LOGIC FROM PreviewModal.tsx
    useEffect(() => {
        const currentSubsection = currentSubsectionId
            ? programData.sections.flatMap(s => s.subsections).find(sub => sub.id === currentSubsectionId)
            : null;
        if (!currentSubsection || !currentSubsection.assignedContent) {
            setPageData(null);
            setLoading(false);
            setError(null);
            return;
        }
        // Check if this is WODs or BLOCKS content that needs special fetching - EXACT LOGIC FROM PreviewModal.tsx
        if (currentSubsection.assignedContent.type === 'wods' || currentSubsection.assignedContent.type === 'blocks') {
            // For WODs/BLOCKS, we need to fetch from database directly
            const contentId = currentSubsection.assignedContent.id;
            if (contentId) {
                fetchPageData(contentId, currentSubsection.assignedContent.type);
            }
            else {
                setError('No content ID available for fetching');
                setPageData(null);
                setLoading(false);
            }
        }
        else {
            // For other content types, handle differently or show error
            setError(`Unsupported content type: ${currentSubsection.assignedContent.type}`);
            setPageData(null);
            setLoading(false);
        }
    }, [currentSubsectionId, programData]);
    // Get all subsections with assigned content
    const assignedSubsections = programData.sections.flatMap(section => section.subsections.filter(sub => sub.assignedContent));
    const currentSubsection = currentSubsectionId
        ? programData.sections.flatMap(s => s.subsections).find(sub => sub.id === currentSubsectionId)
        : null;
    const currentIndex = assignedSubsections.findIndex(sub => sub.id === currentSubsectionId);
    const canNavigatePrev = currentIndex > 0;
    const canNavigateNext = currentIndex < assignedSubsections.length - 1;
    const navigatePrev = () => {
        if (canNavigatePrev) {
            onSubsectionSelect(assignedSubsections[currentIndex - 1].id);
        }
    };
    const navigateNext = () => {
        if (canNavigateNext) {
            onSubsectionSelect(assignedSubsections[currentIndex + 1].id);
        }
    };
    // Repository configuration for icon - copying from PreviewModal.tsx
    const getRepositoryIcon = (repo) => {
        switch (repo) {
            case 'wods': return Dumbbell;
            case 'blocks': return Package;
            case 'programs': return Calendar;
            default: return FileText;
        }
    };
    const getRepositoryColor = (repo) => {
        switch (repo) {
            case 'wods': return 'orange';
            case 'blocks': return 'blue';
            case 'programs': return 'purple';
            default: return 'gray';
        }
    };
    if (assignedSubsections.length === 0) {
        return (_jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("div", { className: "bg-gray-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4", children: _jsx(FileText, { className: "h-12 w-12 text-gray-400" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No Content Assigned" }), _jsx("p", { className: "text-sm text-gray-500", children: "Assign WODs or BLOCKS to subsections to preview them here. Use the three-dot menu on any subsection and select \"Assign\"." })] }) }));
    }
    if (!currentSubsection || !currentSubsection.assignedContent) {
        return (_jsx("div", { className: "flex-1 flex flex-col", children: _jsxs("div", { className: "flex-1 p-6", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: ["Program Content (", assignedSubsections.length, " items)"] }), _jsx("div", { className: "space-y-3", children: assignedSubsections.map((subsection, index) => {
                            const section = programData.sections.find(s => s.id === subsection.sectionId);
                            if (!subsection.assignedContent)
                                return null;
                            const RepositoryIcon = getRepositoryIcon(subsection.assignedContent.type);
                            const color = getRepositoryColor(subsection.assignedContent.type);
                            return (_jsx("div", { onClick: () => onSubsectionSelect(subsection.id), className: "p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `p-2 rounded-lg ${color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                                color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`, children: _jsx(RepositoryIcon, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-xs text-gray-500 mb-1", children: [section?.title, " \u2022 Item ", index + 1] }), _jsx("p", { className: "text-sm font-medium text-gray-900 mb-1", children: subsection.title }), _jsxs("p", { className: "text-sm text-gray-600 truncate", children: [subsection.assignedContent.type.toUpperCase(), ": ", subsection.assignedContent.title] })] })] }) }, subsection.id));
                        }) })] }) }));
    }
    const section = programData.sections.find(s => s.id === currentSubsection.sectionId);
    const color = getRepositoryColor(currentSubsection.assignedContent.type);
    const RepositoryIcon = getRepositoryIcon(currentSubsection.assignedContent.type);
    return (_jsxs("div", { className: "flex-1 flex flex-col h-full", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 bg-white", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-sm text-gray-500", children: [currentIndex + 1, " of ", assignedSubsections.length] }), _jsx("span", { className: "text-sm text-gray-400", children: "\u2022" }), _jsx("span", { className: "text-sm text-gray-600", children: section?.title })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: navigatePrev, disabled: !canNavigatePrev, className: "p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors", children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsx("button", { onClick: navigateNext, disabled: !canNavigateNext, className: "p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors", children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-8 bg-gray-50 min-h-0", children: [_jsxs("div", { className: "max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8", children: [loading && (_jsxs("div", { className: "text-center py-16", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" }), _jsx("p", { className: "text-sm text-gray-500", children: "Loading content..." })] })), error && (_jsxs("div", { className: "text-center py-16", children: [_jsx("div", { className: "text-red-500 mb-4", children: _jsx(RepositoryIcon, { className: "h-12 w-12 mx-auto" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Failed to Load Content" }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: error }), _jsx("button", { onClick: () => {
                                            if (currentSubsection.assignedContent) {
                                                fetchPageData(currentSubsection.assignedContent.id, currentSubsection.assignedContent.type);
                                            }
                                        }, className: `px-4 py-2 text-white rounded-lg transition-colors ${color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                                            color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                                                color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}`, children: "Try Again" })] })), pageData && !loading && !error && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: `text-3xl font-bold mb-4 ${color === 'orange' ? 'text-orange-900' :
                                                    color === 'blue' ? 'text-blue-900' :
                                                        color === 'purple' ? 'text-purple-900' : 'text-gray-900'}`, children: pageData.title }), pageData.description && (_jsx("p", { className: "text-lg text-gray-600 leading-relaxed", children: pageData.description })), _jsxs("div", { className: "flex items-center space-x-6 mt-4 text-sm text-gray-500", children: [pageData.settings.estimatedDuration && (_jsxs("span", { children: ["Duration: ", pageData.settings.estimatedDuration, " minutes"] })), pageData.settings.difficulty && (_jsxs("span", { children: ["Difficulty: ", pageData.settings.difficulty, "/5"] })), pageData.settings.tags && pageData.settings.tags.length > 0 && (_jsxs("span", { children: ["Tags: ", pageData.settings.tags.join(', ')] }))] })] }), (() => {
                                        const currentPage = pageData.pages[0]; // For program preview, always use first page
                                        const blocks = currentPage?.blocks || [];
                                        return blocks.length === 0 ? (_jsxs("div", { className: "text-center py-16", children: [_jsx("div", { className: "text-4xl text-gray-400 mb-4", children: "\uD83D\uDCC4" }), _jsx("h3", { className: "text-xl font-medium text-gray-900 mb-2", children: "No content yet" }), _jsx("p", { className: "text-gray-600", children: "Add some blocks to see the preview content." })] })) : (_jsx("div", { className: "space-y-6", children: blocks.map((block) => (_jsx("div", { className: "preview-block", children: _jsx(BlockRenderer, { block: block, isSelected: false, canMoveUp: false, canMoveDown: false, onSelect: () => { }, onMoveUp: () => { }, onMoveDown: () => { }, isPreview: true }) }, block.id))) }));
                                    })()] })), !pageData && !loading && !error && (_jsxs("div", { className: "text-center py-16", children: [_jsx("div", { className: `h-16 w-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${color === 'orange' ? 'bg-orange-600' :
                                            color === 'blue' ? 'bg-blue-600' :
                                                color === 'purple' ? 'bg-purple-600' : 'bg-gray-600'}`, children: _jsx(RepositoryIcon, { className: "h-8 w-8 text-white" }) }), _jsx("h3", { className: "text-xl font-medium text-gray-900 mb-2", children: currentSubsection.assignedContent.title }), _jsxs("p", { className: "text-gray-600 mb-4", children: [currentSubsection.assignedContent.type.toUpperCase(), " content"] }), _jsx("button", { onClick: () => {
                                            if (currentSubsection.assignedContent) {
                                                fetchPageData(currentSubsection.assignedContent.id, currentSubsection.assignedContent.type);
                                            }
                                        }, className: `px-4 py-2 text-white rounded-lg transition-colors ${color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                                            color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                                                color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}`, children: "Load Content" })] }))] }), _jsx("div", { className: "max-w-3xl mx-auto mt-6 text-center", children: _jsx("div", { className: "text-sm text-gray-600", children: "Preview mode \u2022 Changes are not saved automatically" }) })] })] }));
}
