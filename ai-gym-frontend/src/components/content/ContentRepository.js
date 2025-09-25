import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, Grid, List, Plus, Eye, EyeOff, Calendar, Users as UsersIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
export function ContentRepository({ contentType, title, description, icon: Icon, color }) {
    const navigate = useNavigate();
    const [contentItems, setContentItems] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [itemCounts, setItemCounts] = useState({});
    const mountedRef = useRef(true);
    const lastFetchRef = useRef('');
    const [filters, setFilters] = useState({
        search: '',
        communities: [],
        status: 'all',
        sortBy: 'updated_at',
        sortOrder: 'desc',
        viewMode: 'cards'
    });
    const [showFilters, setShowFilters] = useState(false);
    // Memoized filter key to prevent unnecessary re-renders
    const filterKey = useMemo(() => {
        return JSON.stringify({
            contentType,
            search: filters.search,
            communities: filters.communities.sort(),
            status: filters.status,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder
        });
    }, [contentType, filters.search, filters.communities, filters.status, filters.sortBy, filters.sortOrder]);
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
            // Build query with filters
            let query = supabase
                .from('content_items')
                .select('*')
                .eq('content_type', contentType);
            // Apply search filter
            if (filters.search.trim()) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }
            // Apply status filter
            if (filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }
            // Apply sorting
            query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
            const { data: items, error: itemsError } = await query;
            if (!mountedRef.current)
                return;
            if (itemsError) {
                console.error('Error fetching content items:', itemsError);
                setError('Failed to load content items');
                setContentItems([]);
                return;
            }
            let filteredItems = items || [];
            // Filter by client assignments if specified
            if (filters.communities.length > 0) {
                const { data: assignments, error: assignError } = await supabase
                    .from('content_community_assignments')
                    .select('content_item_id')
                    .in('community_id', filters.communities);
                if (assignError) {
                    console.error('Error fetching assignments:', assignError);
                }
                else if (assignments) {
                    const assignedItemIds = assignments.map(a => a.content_item_id);
                    filteredItems = filteredItems.filter(item => assignedItemIds.includes(item.id));
                }
            }
            if (!mountedRef.current)
                return;
            setContentItems(filteredItems);
            // Fetch assignment counts for each item
            if (filteredItems.length > 0) {
                const itemIds = filteredItems.map(item => item.id);
                const [communityAssignments, userAssignments] = await Promise.all([
                    supabase.from('content_community_assignments').select('content_item_id').in('content_item_id', itemIds),
                    supabase.from('content_user_assignments').select('content_item_id').in('content_item_id', itemIds)
                ]);
                const counts = {};
                itemIds.forEach(id => {
                    const communityCount = communityAssignments.data?.filter(a => a.content_item_id === id).length || 0;
                    const userCount = userAssignments.data?.filter(a => a.content_item_id === id).length || 0;
                    counts[id] = communityCount + userCount;
                });
                if (mountedRef.current) {
                    setItemCounts(counts);
                }
            }
        }
        catch (error) {
            console.error('Error in fetchData:', error);
            if (mountedRef.current) {
                setError('Failed to load content');
                setContentItems([]);
            }
        }
        finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [contentType, filterKey, filters.search, filters.communities, filters.status, filters.sortBy, filters.sortOrder]);
    // Fetch communities once on mount
    const fetchCommunities = useCallback(async () => {
        try {
            const { data: communitiesData, error: communityError } = await supabase
                .from('clients')
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
    const getRoutePrefix = useCallback(() => {
        const routeMap = {
            'ai_agent': 'ai-agents',
            'video': 'videos',
            'document': 'documents',
            'image': 'images',
            'pdf': 'pdfs',
            'prompt': 'prompts',
            'automation': 'automations'
        };
        return routeMap[contentType] || contentType;
    }, [contentType]);
    const handleCreateNew = useCallback(() => {
        const routePrefix = getRoutePrefix();
        navigate(`/content/${routePrefix}/create`);
    }, [navigate, getRoutePrefix]);
    const handleItemClick = useCallback((itemId) => {
        const routePrefix = getRoutePrefix();
        navigate(`/content/${routePrefix}/${itemId}/edit`);
    }, [navigate, getRoutePrefix]);
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);
    const clearAllFilters = useCallback(() => {
        setFilters(prev => ({
            search: '',
            communities: [],
            status: 'all',
            sortBy: 'updated_at',
            sortOrder: 'desc',
            viewMode: prev.viewMode // Preserve view mode
        }));
    }, []);
    const getStatusBadge = useCallback((status) => {
        return (_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'}`, children: status === 'published' ? (_jsxs(_Fragment, { children: [_jsx(Eye, { className: "h-3 w-3 mr-1" }), " Published"] })) : (_jsxs(_Fragment, { children: [_jsx(EyeOff, { className: "h-3 w-3 mr-1" }), " Draft"] })) }));
    }, []);
    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);
    // Error state
    if (error && !loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-red-500 mb-4", children: _jsx(Icon, { className: "h-12 w-12 mx-auto" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Error Loading Content" }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: error }), _jsx("button", { onClick: () => {
                                setError(null);
                                fetchData();
                            }, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Try Again" })] }) }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: "min-h-screen flex bg-gray-50", children: [_jsxs("div", { className: `transition-all duration-300 ${showFilters ? 'w-80' : 'w-12'} bg-white border-r border-gray-200 flex flex-col shadow-sm`, children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: "flex items-center justify-center w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors", children: [_jsx(Filter, { className: "h-5 w-5" }), showFilters && _jsx("span", { className: "ml-2 text-sm font-medium", children: "Filters" })] }) }), showFilters && (_jsxs("div", { className: "flex-1 p-4 space-y-6 overflow-y-auto", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search Content" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }), _jsx("input", { type: "text", placeholder: "Search by title or description...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Publication Status" }), _jsxs("select", { value: filters.status, onChange: (e) => handleFilterChange('status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "published", children: "Published Only" }), _jsx("option", { value: "draft", children: "Drafts Only" })] })] }), communities.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Filter by Communities" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2", children: communities.map((community) => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: filters.communities.includes(community.id), onChange: (e) => {
                                                            if (e.target.checked) {
                                                                handleFilterChange('communities', [...filters.communities, community.id]);
                                                            }
                                                            else {
                                                                handleFilterChange('communities', filters.communities.filter(id => id !== community.id));
                                                            }
                                                        }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: community.brand_color } }), _jsx("span", { className: "text-sm text-gray-900", children: community.name })] })] }, community.id))) })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Sort Content" }), _jsxs("select", { value: `${filters.sortBy}_${filters.sortOrder}`, onChange: (e) => {
                                                const [sortBy, sortOrder] = e.target.value.split('_');
                                                handleFilterChange('sortBy', sortBy);
                                                handleFilterChange('sortOrder', sortOrder);
                                            }, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm", children: [_jsx("option", { value: "updated_at_desc", children: "Last Updated (Newest)" }), _jsx("option", { value: "updated_at_asc", children: "Last Updated (Oldest)" }), _jsx("option", { value: "created_at_desc", children: "Date Created (Newest)" }), _jsx("option", { value: "created_at_asc", children: "Date Created (Oldest)" }), _jsx("option", { value: "title_asc", children: "Title (A-Z)" }), _jsx("option", { value: "title_desc", children: "Title (Z-A)" })] })] }), _jsx("div", { className: "pt-4 border-t border-gray-200", children: _jsx("button", { onClick: clearAllFilters, className: "w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors", children: "Clear All Filters" }) })] }))] }), _jsxs("div", { className: "flex-1 flex flex-col", children: [_jsx("div", { className: "bg-white border-b border-gray-200 px-6 py-4 shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm", style: { backgroundColor: color + '15' }, children: _jsx(Icon, { className: "h-6 w-6", style: { color } }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: description }), _jsxs("div", { className: "flex items-center space-x-4 mt-2", children: [_jsxs("span", { className: "text-xs text-gray-500", children: [contentItems.length, " ", contentItems.length === 1 ? 'item' : 'items'] }), filters.status !== 'all' && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 Filtered by ", filters.status] })), filters.communities.length > 0 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 ", filters.communities.length, " client(s)"] }))] })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex bg-gray-100 rounded-lg p-1", children: [_jsx("button", { onClick: () => handleFilterChange('viewMode', 'cards'), className: `p-2 rounded-md transition-colors ${filters.viewMode === 'cards'
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'}`, title: "Card View", children: _jsx(Grid, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleFilterChange('viewMode', 'list'), className: `p-2 rounded-md transition-colors ${filters.viewMode === 'list'
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'}`, title: "List View", children: _jsx(List, { className: "h-4 w-4" }) })] }), _jsxs("button", { onClick: handleCreateNew, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all", style: { backgroundColor: color, boxShadow: `0 4px 12px ${color}40` }, children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create New"] })] })] }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex justify-center items-center py-20", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsxs("p", { className: "text-sm text-gray-500 mt-3", children: ["Loading ", title.toLowerCase(), "..."] })] }) })) : (_jsx(_Fragment, { children: contentItems.length === 0 ? (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4", style: { backgroundColor: color + '10' }, children: _jsx(Icon, { className: "h-12 w-12", style: { color } }) }), _jsxs("h3", { className: "text-lg font-medium text-gray-900", children: ["No ", title.toLowerCase(), " yet"] }), _jsx("p", { className: "text-sm text-gray-500 mt-2 max-w-sm mx-auto", children: filters.search || filters.status !== 'all' || filters.communities.length > 0
                                                ? `No ${title.toLowerCase()} match your current filters. Try adjusting your search criteria.`
                                                : `Get started by creating your first ${contentType.replace('_', ' ')}.` }), _jsx("div", { className: "mt-8", children: filters.search || filters.status !== 'all' || filters.communities.length > 0 ? (_jsx("button", { onClick: clearAllFilters, className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Clear Filters" })) : (_jsxs("button", { onClick: handleCreateNew, className: "inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2", style: { backgroundColor: color }, children: [_jsx(Plus, { className: "-ml-1 mr-2 h-5 w-5" }), "Create ", contentType.replace('_', ' ')] })) })] })) : (_jsx("div", { className: filters.viewMode === 'cards'
                                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                                        : 'space-y-3', children: contentItems.map((item) => (_jsx("div", { onClick: () => handleItemClick(item.id), className: `${filters.viewMode === 'cards'
                                            ? 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md cursor-pointer transition-all hover:scale-105'
                                            : 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-all'}`, children: filters.viewMode === 'cards' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "h-32 bg-gradient-to-br from-opacity-10 to-opacity-20 flex items-center justify-center relative", style: {
                                                        backgroundColor: color + '08',
                                                        backgroundImage: `linear-gradient(135deg, ${color}15, ${color}05)`
                                                    }, children: [_jsx(Icon, { className: "h-8 w-8", style: { color } }), item.thumbnail_url && (_jsx("img", { src: item.thumbnail_url, alt: item.title, className: "absolute inset-0 w-full h-full object-cover" }))] }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 line-clamp-2 leading-5", children: item.title }), getStatusBadge(item.status)] }), item.description && (_jsx("p", { className: "text-xs text-gray-600 line-clamp-2 mb-3 leading-4", children: item.description })), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), _jsx("span", { children: formatDate(item.updated_at) })] }), itemCounts[item.id] > 0 && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(UsersIcon, { className: "h-3 w-3" }), _jsx("span", { children: itemCounts[item.id] })] }))] })] })] })) : (
                                        /* List View */
                                        _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0", style: { backgroundColor: color + '15' }, children: _jsx(Icon, { className: "h-6 w-6", style: { color } }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 truncate", children: item.title }), getStatusBadge(item.status)] }), item.description && (_jsx("p", { className: "text-xs text-gray-600 truncate mt-1", children: item.description })), _jsx("div", { className: "flex items-center justify-between mt-2", children: _jsxs("div", { className: "flex items-center space-x-4 text-xs text-gray-500", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), _jsxs("span", { children: ["Updated ", formatDate(item.updated_at)] })] }), itemCounts[item.id] > 0 && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(UsersIcon, { className: "h-3 w-3" }), _jsxs("span", { children: [itemCounts[item.id], " assignment", itemCounts[item.id] !== 1 ? 's' : ''] })] }))] }) })] })] })) }, item.id))) })) })) })] })] }) }));
}
export default ContentRepository;
