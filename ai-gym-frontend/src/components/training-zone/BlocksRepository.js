import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, Grid, List, Plus, Eye, EyeOff, Calendar, Package } from 'lucide-react';
export function BlocksRepository() {
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignmentCounts, setAssignmentCounts] = useState({});
    const mountedRef = useRef(true);
    const lastFetchRef = useRef('');
    const [filters, setFilters] = useState({
        search: '',
        communities: [],
        status: 'all',
        difficulty: 'all',
        sortBy: 'updated_at',
        sortOrder: 'desc',
        viewMode: 'cards'
    });
    const [showFilters, setShowFilters] = useState(false);
    // Memoized filter key to prevent unnecessary re-renders
    const filterKey = useMemo(() => {
        return JSON.stringify({
            search: filters.search,
            communities: filters.communities.sort(),
            status: filters.status,
            difficulty: filters.difficulty,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder
        });
    }, [filters.search, filters.communities, filters.status, filters.difficulty, filters.sortBy, filters.sortOrder]);
    // Stable fetch function
    const fetchData = useCallback(async () => {
        if (!mountedRef.current)
            return;
        const currentFilterKey = filterKey;
        // Prevent duplicate requests
        if (lastFetchRef.current === currentFilterKey) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            lastFetchRef.current = currentFilterKey;
            // Build query parameters
            const params = new URLSearchParams();
            if (filters.search.trim()) {
                params.append('search', filters.search);
            }
            if (filters.status !== 'all') {
                params.append('status', filters.status);
            }
            if (filters.difficulty !== 'all') {
                params.append('difficulty', filters.difficulty);
            }
            const queryString = params.toString();
            const url = queryString ? `workout-blocks-api?${queryString}` : 'workout-blocks-api';
            const { data, error } = await supabase.functions.invoke(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!mountedRef.current)
                return;
            if (error) {
                console.error('Error fetching workout blocks:', error);
                setError('Failed to load BLOCKS');
                setBlocks([]);
                return;
            }
            let filteredBlocks = data?.data || [];
            // Filter by community assignments if specified
            if (filters.communities.length > 0) {
                const { data: assignments, error: assignError } = await supabase
                    .from('workout_block_community_assignments')
                    .select('workout_block_id')
                    .in('community_id', filters.communities);
                if (assignError) {
                    console.error('Error fetching assignments:', assignError);
                }
                else if (assignments) {
                    const assignedBlockIds = assignments.map(a => a.workout_block_id);
                    filteredBlocks = filteredBlocks.filter((block) => assignedBlockIds.includes(block.id));
                }
            }
            // Apply client-side sorting
            filteredBlocks.sort((a, b) => {
                const aValue = a[filters.sortBy];
                const bValue = b[filters.sortBy];
                if (filters.sortOrder === 'asc') {
                    return aValue.localeCompare(bValue);
                }
                else {
                    return bValue.localeCompare(aValue);
                }
            });
            if (!mountedRef.current)
                return;
            setBlocks(filteredBlocks);
            // Fetch assignment counts for each block
            if (filteredBlocks.length > 0) {
                const blockIds = filteredBlocks.map((block) => block.id);
                const communityAssignments = await supabase
                    .from('workout_block_community_assignments')
                    .select('workout_block_id')
                    .in('workout_block_id', blockIds);
                const counts = {};
                blockIds.forEach(id => {
                    const communityCount = communityAssignments.data?.filter(a => a.workout_block_id === id).length || 0;
                    counts[id] = communityCount;
                });
                if (mountedRef.current) {
                    setAssignmentCounts(counts);
                }
            }
        }
        catch (error) {
            console.error('Error in fetchData:', error);
            if (mountedRef.current) {
                setError('Failed to load BLOCKS');
                setBlocks([]);
            }
        }
        finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [filterKey, filters.search, filters.communities, filters.status, filters.difficulty, filters.sortBy, filters.sortOrder]);
    // Fetch communities once on mount
    const fetchCommunities = useCallback(async () => {
        try {
            const { data: communitiesData, error: communityError } = await supabase
                .from('communities')
                .select('*')
                .eq('status', 'active')
                .order('name');
            if (communityError) {
                console.error('Error fetching communities:', communityError);
            }
            else if (communitiesData && mountedRef.current) {
                setCommunities(communitiesData);
            }
        }
        catch (error) {
            console.error('Error fetching communities:', error);
        }
    }, []);
    // Initial data fetch on mount and filter changes
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    // Fetch communities on mount
    useEffect(() => {
        fetchCommunities();
    }, [fetchCommunities]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);
    const handleCreateNew = useCallback(() => {
        navigate('/page-builder?repo=blocks');
    }, [navigate]);
    const handleBlockClick = useCallback((blockId) => {
        navigate(`/page-builder?repo=blocks&id=${blockId}`);
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
            sortBy: 'updated_at',
            sortOrder: 'desc',
            viewMode: prev.viewMode // Preserve view mode
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
    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);
    const formatDuration = useCallback((minutes) => {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }, []);
    // Error state
    if (error && !loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-red-500 mb-4", children: _jsx(Package, { className: "h-12 w-12 mx-auto" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Error Loading BLOCKS" }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: error }), _jsx("button", { onClick: () => {
                            setError(null);
                            fetchData();
                        }, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Try Again" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-full flex bg-gray-50", children: [_jsxs("div", { className: `transition-all duration-300 ${showFilters ? 'w-80' : 'w-12'} bg-white border-r border-gray-200 flex flex-col shadow-sm`, children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: "flex items-center justify-center w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors", children: [_jsx(Filter, { className: "h-5 w-5" }), showFilters && _jsx("span", { className: "ml-2 text-sm font-medium", children: "Filters" })] }) }), showFilters && (_jsxs("div", { className: "flex-1 p-4 space-y-6 overflow-y-auto", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search BLOCKS" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }), _jsx("input", { type: "text", placeholder: "Search by title or description...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Publication Status" }), _jsxs("select", { value: filters.status, onChange: (e) => handleFilterChange('status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "published", children: "Published Only" }), _jsx("option", { value: "draft", children: "Drafts Only" }), _jsx("option", { value: "archived", children: "Archived Only" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Difficulty Level" }), _jsxs("select", { value: filters.difficulty, onChange: (e) => handleFilterChange('difficulty', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm", children: [_jsx("option", { value: "all", children: "All Levels" }), _jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] }), communities.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Filter by Communities" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2", children: communities.map((community) => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: filters.communities.includes(community.id), onChange: (e) => {
                                                        if (e.target.checked) {
                                                            handleFilterChange('communities', [...filters.communities, community.id]);
                                                        }
                                                        else {
                                                            handleFilterChange('communities', filters.communities.filter(id => id !== community.id));
                                                        }
                                                    }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: community.brand_color } }), _jsx("span", { className: "text-sm text-gray-900", children: community.name })] })] }, community.id))) })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Sort BLOCKS" }), _jsxs("select", { value: `${filters.sortBy}_${filters.sortOrder}`, onChange: (e) => {
                                            const [sortBy, sortOrder] = e.target.value.split('_');
                                            handleFilterChange('sortBy', sortBy);
                                            handleFilterChange('sortOrder', sortOrder);
                                        }, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm", children: [_jsx("option", { value: "updated_at_desc", children: "Last Updated (Newest)" }), _jsx("option", { value: "updated_at_asc", children: "Last Updated (Oldest)" }), _jsx("option", { value: "created_at_desc", children: "Date Created (Newest)" }), _jsx("option", { value: "created_at_asc", children: "Date Created (Oldest)" }), _jsx("option", { value: "title_asc", children: "Title (A-Z)" }), _jsx("option", { value: "title_desc", children: "Title (Z-A)" })] })] }), _jsx("div", { className: "pt-4 border-t border-gray-200", children: _jsx("button", { onClick: clearAllFilters, className: "w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors", children: "Clear All Filters" }) })] }))] }), _jsxs("div", { className: "flex-1 flex flex-col", children: [_jsx("div", { className: "bg-white border-b border-gray-200 px-6 py-4 shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-blue-100", children: _jsx(Package, { className: "h-6 w-6 text-blue-600" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "BLOCKS (Modular Workout Components)" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Create and manage reusable workout building blocks" }), _jsxs("div", { className: "flex items-center space-x-4 mt-2", children: [_jsxs("span", { className: "text-xs text-gray-500", children: [blocks.length, " ", blocks.length === 1 ? 'BLOCK' : 'BLOCKS'] }), filters.status !== 'all' && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 Filtered by ", filters.status] })), filters.difficulty !== 'all' && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 ", filters.difficulty, " level"] })), filters.communities.length > 0 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 ", filters.communities.length, " community(s)"] }))] })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex bg-gray-100 rounded-lg p-1", children: [_jsx("button", { onClick: () => handleFilterChange('viewMode', 'cards'), className: `p-2 rounded-md transition-colors ${filters.viewMode === 'cards'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'}`, title: "Card View", children: _jsx(Grid, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleFilterChange('viewMode', 'list'), className: `p-2 rounded-md transition-colors ${filters.viewMode === 'list'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'}`, title: "List View", children: _jsx(List, { className: "h-4 w-4" }) })] }), _jsxs("button", { onClick: handleCreateNew, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create BLOCK"] })] })] }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex justify-center items-center py-20", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading BLOCKS..." })] }) })) : blocks.length === 0 ? (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "bg-blue-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4", children: _jsx(Package, { className: "h-12 w-12 text-blue-600" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "No BLOCKS found" }), _jsx("p", { className: "text-sm text-gray-500 mt-2 max-w-sm mx-auto", children: filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.communities.length > 0
                                        ? 'Try adjusting your filters to find more results.'
                                        : 'BLOCKS are modular workout components that can be reused across different programs. Get started by creating your first BLOCK.' }), _jsx("div", { className: "mt-6", children: _jsxs("button", { onClick: handleCreateNew, className: "inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create BLOCK"] }) })] })) : (_jsx("div", { className: filters.viewMode === 'cards'
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                                : 'space-y-4', children: blocks.map((block) => (_jsx("div", { onClick: () => handleBlockClick(block.id), className: `cursor-pointer group transition-all ${filters.viewMode === 'cards'
                                    ? 'border border-gray-200 rounded-lg overflow-hidden hover:shadow-md bg-white'
                                    : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white'}`, children: filters.viewMode === 'cards' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "aspect-video bg-gray-200 relative overflow-hidden", children: [block.thumbnail_url ? (_jsx("img", { src: block.thumbnail_url, alt: block.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center", children: _jsx(Package, { className: "h-8 w-8 text-white" }) })), _jsx("div", { className: "absolute top-2 right-2 flex space-x-1", children: getStatusBadge(block.status) }), _jsx("div", { className: "absolute top-2 left-2", children: _jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: block.block_category }) })] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2", children: block.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1 line-clamp-2", children: block.description || 'No description provided' }), _jsx("div", { className: "flex items-center justify-between mt-3", children: _jsxs("div", { className: "flex items-center space-x-2", children: [block.difficulty_level && getDifficultyBadge(block.difficulty_level), block.estimated_duration_minutes && (_jsxs("span", { className: "inline-flex items-center text-xs text-gray-500", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDuration(block.estimated_duration_minutes)] }))] }) }), block.equipment_needed && block.equipment_needed.length > 0 && (_jsxs("div", { className: "mt-2 flex flex-wrap gap-1", children: [block.equipment_needed.slice(0, 2).map((equipment, index) => (_jsx("span", { className: "inline-block text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded", children: equipment }, index))), block.equipment_needed.length > 2 && (_jsxs("span", { className: "inline-block text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded", children: ["+", block.equipment_needed.length - 2, " more"] }))] }))] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0", children: block.thumbnail_url ? (_jsx("img", { src: block.thumbnail_url, alt: block.title, className: "w-full h-full object-cover rounded-lg" })) : (_jsx(Package, { className: "h-6 w-6 text-gray-500" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-semibold text-gray-900 truncate", children: block.title }), _jsx("p", { className: "text-sm text-gray-600 truncate", children: block.description || 'No description provided' }), _jsxs("div", { className: "flex items-center space-x-3 mt-2", children: [getStatusBadge(block.status), _jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: block.block_category }), block.difficulty_level && getDifficultyBadge(block.difficulty_level), block.estimated_duration_minutes && (_jsxs("span", { className: "inline-flex items-center text-xs text-gray-500", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDuration(block.estimated_duration_minutes)] })), _jsxs("span", { className: "text-xs text-gray-500", children: ["Updated ", formatDate(block.updated_at)] })] })] })] })) }, block.id))) })) })] })] }));
}
export default BlocksRepository;
