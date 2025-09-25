import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, Grid, List, Plus, Eye, EyeOff, Calendar, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
// Mock data for demonstration
const mockPrograms = [
    {
        id: '1',
        title: 'Beginner Fitness Foundation',
        description: 'A comprehensive 8-week program designed for fitness beginners to build strength, endurance, and healthy habits.',
        thumbnail_url: '',
        status: 'published',
        estimated_duration_weeks: 8,
        difficulty_level: 'beginner',
        tags: ['foundation', 'beginner', 'full-body'],
        created_by: 'admin',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
        folder_id: null,
        is_favorite: false,
        program_type: 'strength',
        weeks_count: 8
    },
    {
        id: '2',
        title: 'Advanced Strength Building',
        description: 'Intensive 12-week program focused on progressive strength training and muscle development.',
        thumbnail_url: '',
        status: 'published',
        estimated_duration_weeks: 12,
        difficulty_level: 'advanced',
        tags: ['strength', 'muscle-gain', 'progressive'],
        created_by: 'admin',
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-20T00:00:00Z',
        folder_id: null,
        is_favorite: true,
        program_type: 'muscle-gain',
        weeks_count: 12
    },
    {
        id: '3',
        title: 'Cardio Blast Program',
        description: 'High-intensity 6-week cardiovascular program to improve endurance and burn calories.',
        thumbnail_url: '',
        status: 'draft',
        estimated_duration_weeks: 6,
        difficulty_level: 'intermediate',
        tags: ['cardio', 'hiit', 'endurance'],
        created_by: 'admin',
        created_at: '2025-01-05T00:00:00Z',
        updated_at: '2025-01-22T00:00:00Z',
        folder_id: null,
        is_favorite: false,
        program_type: 'cardio',
        weeks_count: 6
    }
];
const mockCommunities = [
    { id: '1', name: 'Fitness Beginners', brand_color: '#10B981' },
    { id: '2', name: 'Strength Athletes', brand_color: '#F59E0B' },
    { id: '3', name: 'Cardio Enthusiasts', brand_color: '#EF4444' }
];
export function ProgramsRepository() {
    const navigate = useNavigate();
    const [programs, setPrograms] = useState([]);
    const [folders, setFolders] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assignmentCounts, setAssignmentCounts] = useState({});
    const mountedRef = useRef(true);
    // Selection and bulk operations state
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    // Folder creation modal state
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [folderCreating, setFolderCreating] = useState(false);
    const [folderError, setFolderError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        communities: [],
        status: 'all',
        difficulty: 'all',
        programType: 'all',
        sortBy: 'updated_at',
        sortOrder: 'desc',
        viewMode: 'cards',
        showFavorites: false,
        folderId: null
    });
    const [showFilters, setShowFilters] = useState(false);
    // Load real data from API
    useEffect(() => {
        loadPrograms();
        setCommunities(mockCommunities); // TODO: Load from communities API when available
    }, []);
    const loadPrograms = async () => {
        try {
            setLoading(true);
            setError(null);
            // Get current user session for authentication
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('User not authenticated');
            }
            // Load from programs API
            const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co';
            const apiUrl = `${supabaseUrl}/functions/v1/programs-api`;
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
                throw new Error(errorData.error?.message || `Failed to load programs: ${response.status}`);
            }
            const data = await response.json();
            const apiPrograms = data.data || [];
            // Transform API data to frontend format
            const transformedPrograms = apiPrograms.map((program) => ({
                id: program.id,
                title: program.title,
                description: program.description || '',
                thumbnail_url: program.thumbnail_url || '',
                status: program.status,
                estimated_duration_weeks: program.estimated_duration_weeks,
                difficulty_level: program.difficulty_level,
                tags: program.tags || [],
                created_by: program.created_by,
                created_at: program.created_at,
                updated_at: program.updated_at,
                folder_id: null, // TODO: Implement folder support
                is_favorite: false, // TODO: Implement favorites
                program_type: program.program_type,
                weeks_count: program.estimated_duration_weeks
            }));
            setPrograms(transformedPrograms);
        }
        catch (err) {
            console.error('Error loading programs:', err);
            setError(err instanceof Error ? err.message : 'Failed to load programs');
            // Fall back to mock data on error
            setPrograms(mockPrograms);
        }
        finally {
            setLoading(false);
        }
    };
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);
    const handleCreateNew = useCallback(() => {
        navigate('/program-builder');
    }, [navigate]);
    const handleProgramClick = useCallback((programId) => {
        navigate(`/program-builder?id=${programId}`);
    }, [navigate]);
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);
    const clearAllFilters = useCallback(() => {
        setFilters(prev => ({
            search: '',
            communities: [],
            status: 'all',
            difficulty: 'all',
            programType: 'all',
            sortBy: 'updated_at',
            sortOrder: 'desc',
            viewMode: prev.viewMode, // Preserve view mode
            showFavorites: false,
            folderId: null
        }));
    }, []);
    const getStatusBadge = useCallback((status) => {
        const statusConfig = {
            'published': { color: 'bg-green-100 text-green-800', icon: Eye, label: 'Published' },
            'draft': { color: 'bg-yellow-100 text-yellow-800', icon: EyeOff, label: 'Draft' },
            'archived': { color: 'bg-gray-100 text-gray-800', icon: EyeOff, label: 'Archived' }
        };
        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;
        return (_jsxs("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`, children: [_jsx(Icon, { className: "h-3 w-3 mr-1" }), config.label] }));
    }, []);
    const getDifficultyBadge = useCallback((difficulty) => {
        const difficultyConfig = {
            'beginner': 'bg-green-100 text-green-800',
            'intermediate': 'bg-yellow-100 text-yellow-800',
            'advanced': 'bg-red-100 text-red-800'
        };
        return (_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${difficultyConfig[difficulty] || 'bg-gray-100 text-gray-800'}`, children: difficulty }));
    }, []);
    const getProgramTypeBadge = useCallback((programType) => {
        const typeConfig = {
            'strength': 'bg-blue-100 text-blue-800',
            'cardio': 'bg-red-100 text-red-800',
            'weight-loss': 'bg-orange-100 text-orange-800',
            'muscle-gain': 'bg-purple-100 text-purple-800',
            'endurance': 'bg-green-100 text-green-800',
            'flexibility': 'bg-pink-100 text-pink-800'
        };
        return (_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig[programType] || 'bg-gray-100 text-gray-800'}`, children: programType.replace('-', ' ') }));
    }, []);
    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);
    const formatDuration = useCallback((weeks) => {
        if (weeks === 1) {
            return '1 week';
        }
        return `${weeks} weeks`;
    }, []);
    // Apply filters to programs
    const filteredPrograms = useMemo(() => {
        let filtered = [...programs];
        // Search filter
        if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(program => program.title.toLowerCase().includes(searchTerm) ||
                program.description.toLowerCase().includes(searchTerm));
        }
        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(program => program.status === filters.status);
        }
        // Difficulty filter
        if (filters.difficulty !== 'all') {
            filtered = filtered.filter(program => program.difficulty_level === filters.difficulty);
        }
        // Program type filter
        if (filters.programType !== 'all') {
            filtered = filtered.filter(program => program.program_type === filters.programType);
        }
        // Favorites filter
        if (filters.showFavorites) {
            filtered = filtered.filter(program => program.is_favorite);
        }
        // Sort
        filtered.sort((a, b) => {
            const aValue = a[filters.sortBy];
            const bValue = b[filters.sortBy];
            if (filters.sortOrder === 'asc') {
                return aValue.localeCompare(bValue);
            }
            else {
                return bValue.localeCompare(aValue);
            }
        });
        return filtered;
    }, [programs, filters]);
    // Error state
    if (error && !loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-red-500 mb-4", children: _jsx(Calendar, { className: "h-12 w-12 mx-auto" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Error Loading PROGRAMS" }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: error }), _jsx("button", { onClick: () => {
                            setError(null);
                            loadPrograms();
                        }, className: "px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700", children: "Try Again" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-full flex bg-gray-50", children: [_jsxs("div", { className: `transition-all duration-300 ${showFilters ? 'w-80' : 'w-12'} bg-white border-r border-gray-200 flex flex-col shadow-sm`, children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: "flex items-center justify-center w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors", children: [_jsx(Filter, { className: "h-5 w-5" }), showFilters && _jsx("span", { className: "ml-2 text-sm font-medium", children: "Filters" })] }) }), showFilters && (_jsxs("div", { className: "flex-1 p-4 space-y-6 overflow-y-auto", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search Programs" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }), _jsx("input", { type: "text", placeholder: "Search by title or description...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Publication Status" }), _jsxs("select", { value: filters.status, onChange: (e) => handleFilterChange('status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "published", children: "Published Only" }), _jsx("option", { value: "draft", children: "Drafts Only" }), _jsx("option", { value: "archived", children: "Archived Only" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Difficulty Level" }), _jsxs("select", { value: filters.difficulty, onChange: (e) => handleFilterChange('difficulty', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm", children: [_jsx("option", { value: "all", children: "All Levels" }), _jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Program Type" }), _jsxs("select", { value: filters.programType, onChange: (e) => handleFilterChange('programType', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "strength", children: "Strength" }), _jsx("option", { value: "cardio", children: "Cardio" }), _jsx("option", { value: "weight-loss", children: "Weight Loss" }), _jsx("option", { value: "muscle-gain", children: "Muscle Gain" }), _jsx("option", { value: "endurance", children: "Endurance" }), _jsx("option", { value: "flexibility", children: "Flexibility" })] })] }), communities.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Filter by Communities" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2", children: communities.map((community) => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: filters.communities.includes(community.id), onChange: (e) => {
                                                        if (e.target.checked) {
                                                            handleFilterChange('communities', [...filters.communities, community.id]);
                                                        }
                                                        else {
                                                            handleFilterChange('communities', filters.communities.filter(id => id !== community.id));
                                                        }
                                                    }, className: "rounded border-gray-300 text-purple-600 focus:ring-purple-500" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: community.brand_color } }), _jsx("span", { className: "text-sm text-gray-900", children: community.name })] })] }, community.id))) })] })), _jsx("div", { children: _jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: filters.showFavorites, onChange: (e) => handleFilterChange('showFavorites', e.target.checked), className: "rounded border-gray-300 text-purple-600 focus:ring-purple-500" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Show Favorites Only" })] }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Sort Programs" }), _jsxs("select", { value: `${filters.sortBy}_${filters.sortOrder}`, onChange: (e) => {
                                            const [sortBy, sortOrder] = e.target.value.split('_');
                                            handleFilterChange('sortBy', sortBy);
                                            handleFilterChange('sortOrder', sortOrder);
                                        }, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm", children: [_jsx("option", { value: "updated_at_desc", children: "Last Updated (Newest)" }), _jsx("option", { value: "updated_at_asc", children: "Last Updated (Oldest)" }), _jsx("option", { value: "created_at_desc", children: "Date Created (Newest)" }), _jsx("option", { value: "created_at_asc", children: "Date Created (Oldest)" }), _jsx("option", { value: "title_asc", children: "Title (A-Z)" }), _jsx("option", { value: "title_desc", children: "Title (Z-A)" })] })] }), _jsx("div", { className: "pt-4 border-t border-gray-200", children: _jsx("button", { onClick: clearAllFilters, className: "w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors", children: "Clear All Filters" }) })] }))] }), _jsxs("div", { className: "flex-1 flex flex-col", children: [_jsx("div", { className: "bg-white border-b border-gray-200 px-6 py-4 shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-purple-100", children: _jsx(Calendar, { className: "h-6 w-6 text-purple-600" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "PROGRAMS (Structured Training Programs)" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Create and manage comprehensive fitness programs that combine WODs and BLOCKS" }), _jsxs("div", { className: "flex items-center space-x-4 mt-2", children: [_jsxs("span", { className: "text-xs text-gray-500", children: [filteredPrograms.length, " ", filteredPrograms.length === 1 ? 'PROGRAM' : 'PROGRAMS'] }), filters.status !== 'all' && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 Filtered by ", filters.status] })), filters.difficulty !== 'all' && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 ", filters.difficulty, " level"] })), filters.communities.length > 0 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 ", filters.communities.length, " community(s)"] }))] })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex bg-gray-100 rounded-lg p-1", children: [_jsx("button", { onClick: () => handleFilterChange('viewMode', 'cards'), className: `p-2 rounded-md transition-colors ${filters.viewMode === 'cards'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'}`, title: "Card View", children: _jsx(Grid, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleFilterChange('viewMode', 'list'), className: `p-2 rounded-md transition-colors ${filters.viewMode === 'list'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'}`, title: "List View", children: _jsx(List, { className: "h-4 w-4" }) })] }), _jsxs("button", { onClick: handleCreateNew, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create PROGRAM"] })] })] }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex justify-center items-center py-20", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading Programs..." })] }) })) : filteredPrograms.length === 0 ? (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "bg-purple-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4", children: _jsx(Calendar, { className: "h-12 w-12 text-purple-600" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "No Programs found" }), _jsx("p", { className: "text-sm text-gray-500 mt-2 max-w-sm mx-auto", children: filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.communities.length > 0
                                        ? 'Try adjusting your filters to find more results.'
                                        : 'Get started by creating your first training program.' }), _jsx("div", { className: "mt-6", children: _jsxs("button", { onClick: handleCreateNew, className: "inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create PROGRAM"] }) })] })) : (_jsx("div", { className: filters.viewMode === 'cards'
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                                : 'space-y-4', children: filteredPrograms.map((program) => (_jsx("div", { onClick: () => handleProgramClick(program.id), className: `cursor-pointer group transition-all ${filters.viewMode === 'cards'
                                    ? 'border border-gray-200 rounded-lg overflow-hidden hover:shadow-md bg-white'
                                    : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white'}`, children: filters.viewMode === 'cards' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "aspect-video bg-gray-200 relative overflow-hidden", children: [program.thumbnail_url ? (_jsx("img", { src: program.thumbnail_url, alt: program.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center", children: _jsx(Calendar, { className: "h-8 w-8 text-white" }) })), _jsx("div", { className: "absolute top-2 right-2 flex space-x-1", children: getStatusBadge(program.status) }), program.is_favorite && (_jsx("div", { className: "absolute top-2 left-2", children: _jsx(Star, { className: "h-4 w-4 text-yellow-400 fill-current" }) }))] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2", children: program.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1 line-clamp-2", children: program.description || 'No description provided' }), _jsx("div", { className: "flex items-center justify-between mt-3", children: _jsxs("div", { className: "flex items-center space-x-2", children: [program.difficulty_level && getDifficultyBadge(program.difficulty_level), program.program_type && getProgramTypeBadge(program.program_type)] }) }), _jsxs("div", { className: "flex items-center space-x-2 mt-2", children: [_jsxs("span", { className: "inline-flex items-center text-xs text-gray-500", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDuration(program.estimated_duration_weeks)] }), _jsx("span", { className: "text-xs text-gray-400", children: "\u2022" }), _jsxs("span", { className: "text-xs text-gray-500", children: [program.weeks_count, " weeks"] })] })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0", children: program.thumbnail_url ? (_jsx("img", { src: program.thumbnail_url, alt: program.title, className: "w-full h-full object-cover rounded-lg" })) : (_jsx(Calendar, { className: "h-6 w-6 text-gray-500" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("h3", { className: "font-semibold text-gray-900 truncate", children: program.title }), program.is_favorite && (_jsx(Star, { className: "h-4 w-4 text-yellow-400 fill-current flex-shrink-0" }))] }), _jsx("p", { className: "text-sm text-gray-600 truncate", children: program.description || 'No description provided' }), _jsxs("div", { className: "flex items-center space-x-3 mt-2", children: [getStatusBadge(program.status), program.difficulty_level && getDifficultyBadge(program.difficulty_level), program.program_type && getProgramTypeBadge(program.program_type), _jsxs("span", { className: "inline-flex items-center text-xs text-gray-500", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDuration(program.estimated_duration_weeks)] }), _jsxs("span", { className: "text-xs text-gray-500", children: ["Updated ", formatDate(program.updated_at)] })] })] })] })) }, program.id))) })) })] })] }));
}
export default ProgramsRepository;
