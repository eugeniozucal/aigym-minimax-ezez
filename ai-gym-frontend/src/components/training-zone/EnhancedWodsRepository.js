import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, Grid, List, Plus, Eye, EyeOff, Calendar, Dumbbell, Star, StarOff, FolderPlus, Home, ChevronRight, Folder } from 'lucide-react';
import { ItemContextMenu } from './components/ItemContextMenu';
import { BulkActionBar } from './components/BulkActionBar';
import { FolderCreateModal } from './components/FolderCreateModal';
import { MoveToFolderModal } from './components/MoveToFolderModal';
export function WodsRepository() {
    const navigate = useNavigate();
    const [wods, setWods] = useState([]);
    const [folders, setFolders] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignmentCounts, setAssignmentCounts] = useState({});
    const mountedRef = useRef(true);
    const lastFetchRef = useRef('');
    // Selection and bulk operations state
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    // Folder creation modal state
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [folderCreating, setFolderCreating] = useState(false);
    const [folderError, setFolderError] = useState(null);
    // Move to folder modal state
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [moveItem, setMoveItem] = useState(null);
    const [itemMoving, setItemMoving] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        communities: [],
        status: 'all',
        difficulty: 'all',
        sortBy: 'updated_at',
        sortOrder: 'desc',
        viewMode: 'cards',
        showFavorites: false,
        folderId: null
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
            sortOrder: filters.sortOrder,
            showFavorites: filters.showFavorites,
            folderId: filters.folderId
        });
    }, [filters.search, filters.communities, filters.status, filters.difficulty, filters.sortBy, filters.sortOrder, filters.showFavorites, filters.folderId]);
    // API functions for folder and content management
    const fetchFolders = useCallback(async () => {
        try {
            const { data, error } = await supabase.functions.invoke('folders-api', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (error) {
                console.error('Error fetching folders:', error);
                return [];
            }
            // Filter folders by repository type on client side since API returns all
            const allFolders = data?.data || [];
            return allFolders.filter(folder => folder.repository_type === 'wods');
        }
        catch (error) {
            console.error('Error fetching folders:', error);
            return [];
        }
    }, []);
    const createFolder = useCallback(async (name, parentFolderId) => {
        const { data, error } = await supabase.functions.invoke('folders-api', {
            method: 'POST',
            body: {
                name,
                parent_folder_id: parentFolderId,
                repository_type: 'wods'
            }
        });
        if (error) {
            throw new Error(error.message || 'Failed to create folder');
        }
        return data?.data;
    }, []);
    const bulkOperation = useCallback(async (action, items, folderId) => {
        const { data, error } = await supabase.functions.invoke('content-management-api', {
            method: 'POST',
            body: {
                action,
                items,
                repository_type: 'wods',
                folder_id: folderId
            }
        });
        if (error) {
            throw new Error(error.message || `Failed to ${action} items`);
        }
        return data?.data;
    }, []);
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
            // Build query with filters including new fields
            let query = supabase
                .from('wods')
                .select('*');
            // Apply folder filter
            if (filters.folderId !== null) {
                query = query.eq('folder_id', filters.folderId);
            }
            else {
                query = query.is('folder_id', null);
            }
            // Apply search filter
            if (filters.search.trim()) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }
            // Apply status filter
            if (filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }
            // Apply difficulty filter
            if (filters.difficulty !== 'all') {
                query = query.eq('difficulty_level', filters.difficulty);
            }
            // Apply favorites filter
            if (filters.showFavorites) {
                query = query.eq('is_favorite', true);
            }
            // Apply sorting
            query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
            const { data: wodsData, error: wodsError } = await query;
            if (!mountedRef.current)
                return;
            if (wodsError) {
                console.error('Error fetching WODs:', wodsError);
                setError('Failed to load WODs');
                setWods([]);
                return;
            }
            let filteredWods = wodsData || [];
            // Filter by community assignments if specified
            if (filters.communities.length > 0) {
                const { data: assignments, error: assignError } = await supabase
                    .from('wod_community_assignments')
                    .select('wod_id')
                    .in('community_id', filters.communities);
                if (assignError) {
                    console.error('Error fetching assignments:', assignError);
                }
                else if (assignments) {
                    const assignedWodIds = assignments.map(a => a.wod_id);
                    filteredWods = filteredWods.filter(wod => assignedWodIds.includes(wod.id));
                }
            }
            if (!mountedRef.current)
                return;
            setWods(filteredWods);
            // Fetch assignment counts for each WOD
            if (filteredWods.length > 0) {
                const wodIds = filteredWods.map(wod => wod.id);
                const [communityAssignments, userAssignments] = await Promise.all([
                    supabase.from('wod_community_assignments').select('wod_id').in('wod_id', wodIds),
                    supabase.from('user_wods').select('wod_id').in('wod_id', wodIds)
                ]);
                const counts = {};
                wodIds.forEach(id => {
                    const communityCount = communityAssignments.data?.filter(a => a.wod_id === id).length || 0;
                    const userCount = userAssignments.data?.filter(a => a.wod_id === id).length || 0;
                    counts[id] = communityCount + userCount;
                });
                if (mountedRef.current) {
                    setAssignmentCounts(counts);
                }
            }
        }
        catch (error) {
            console.error('Error in fetchData:', error);
            if (mountedRef.current) {
                setError('Failed to load WODs');
                setWods([]);
            }
        }
        finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [filterKey, filters.search, filters.communities, filters.status, filters.difficulty, filters.sortBy, filters.sortOrder, filters.showFavorites, filters.folderId]);
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
    // Load folders on mount
    useEffect(() => {
        fetchFolders().then(folderData => {
            if (mountedRef.current) {
                setFolders(folderData.filter(f => f.repository_type === 'wods'));
            }
        });
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
    // Selection handlers
    const handleSelectItem = useCallback((itemId, selected) => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            if (selected) {
                newSelected.add(itemId);
            }
            else {
                newSelected.delete(itemId);
            }
            return newSelected;
        });
    }, []);
    const handleSelectAll = useCallback((selected) => {
        if (selected) {
            setSelectedItems(new Set(wods.map(wod => wod.id)));
        }
        else {
            setSelectedItems(new Set());
        }
    }, [wods]);
    const handleClearSelection = useCallback(() => {
        setSelectedItems(new Set());
        setIsSelectionMode(false);
    }, []);
    // Content management handlers
    const handleToggleFavorite = useCallback(async (wodId) => {
        try {
            await bulkOperation('toggle_favorite', [wodId]);
            // Refresh data to show updated favorite status
            fetchData();
        }
        catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }, [bulkOperation, fetchData]);
    const handleCopyItem = useCallback(async (wodId) => {
        try {
            await bulkOperation('copy', [wodId], filters.folderId);
            // Refresh data to show copied item
            fetchData();
        }
        catch (error) {
            console.error('Error copying item:', error);
        }
    }, [bulkOperation, fetchData, filters.folderId]);
    const handleDeleteItem = useCallback(async (wodId) => {
        if (confirm('Are you sure you want to delete this WOD?')) {
            try {
                await bulkOperation('delete', [wodId]);
                // Refresh data to remove deleted item
                fetchData();
            }
            catch (error) {
                console.error('Error deleting item:', error);
            }
        }
    }, [bulkOperation, fetchData]);
    const handleMoveToFolder = useCallback(async (wodId) => {
        const wod = wods.find(w => w.id === wodId);
        if (wod) {
            setMoveItem({ id: wodId, name: wod.title });
            setShowMoveModal(true);
        }
    }, [wods]);
    const handleSingleItemMove = useCallback(async (folderId) => {
        if (!moveItem)
            return;
        setItemMoving(true);
        try {
            await bulkOperation('move', [moveItem.id], folderId);
            fetchData(); // Refresh data to show updated folder
            setShowMoveModal(false);
            setMoveItem(null);
        }
        catch (error) {
            console.error('Error moving item:', error);
        }
        finally {
            setItemMoving(false);
        }
    }, [moveItem, bulkOperation, fetchData]);
    // Bulk operation handlers
    const handleBulkMove = useCallback(async (folderId) => {
        try {
            const targetFolderId = folderId === 'root' ? null : folderId;
            await bulkOperation('move', Array.from(selectedItems), targetFolderId);
            handleClearSelection();
            fetchData();
        }
        catch (error) {
            console.error('Error moving items:', error);
        }
    }, [bulkOperation, selectedItems, handleClearSelection, fetchData]);
    const handleBulkCopy = useCallback(async () => {
        try {
            await bulkOperation('copy', Array.from(selectedItems), filters.folderId);
            handleClearSelection();
            fetchData();
        }
        catch (error) {
            console.error('Error copying items:', error);
        }
    }, [bulkOperation, selectedItems, filters.folderId, handleClearSelection, fetchData]);
    const handleBulkDelete = useCallback(async () => {
        if (confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
            try {
                await bulkOperation('delete', Array.from(selectedItems));
                handleClearSelection();
                fetchData();
            }
            catch (error) {
                console.error('Error deleting items:', error);
            }
        }
    }, [bulkOperation, selectedItems, handleClearSelection, fetchData]);
    // Folder management handlers
    const handleCreateFolder = useCallback(async (name, parentFolderId) => {
        setFolderCreating(true);
        setFolderError(null);
        try {
            const newFolder = await createFolder(name, parentFolderId);
            // Refresh folders
            const updatedFolders = await fetchFolders();
            setFolders(updatedFolders.filter(f => f.repository_type === 'wods'));
            setShowFolderModal(false);
        }
        catch (error) {
            setFolderError(error.message);
        }
        finally {
            setFolderCreating(false);
        }
    }, [createFolder, fetchFolders]);
    const handleCreateFolderAndMove = useCallback(async () => {
        setShowFolderModal(true);
    }, []);
    const handleNavigateToFolder = useCallback((folderId) => {
        setFilters(prev => ({ ...prev, folderId }));
        handleClearSelection();
    }, [handleClearSelection]);
    // Get current folder and breadcrumb path
    const currentFolder = useMemo(() => {
        return folders.find(f => f.id === filters.folderId) || null;
    }, [folders, filters.folderId]);
    const breadcrumbPath = useMemo(() => {
        const path = [];
        let current = currentFolder;
        while (current) {
            path.unshift(current);
            current = folders.find(f => f.id === current?.parent_folder_id) || null;
        }
        return path;
    }, [currentFolder, folders]);
    // Get folders in current directory
    const currentFolders = useMemo(() => {
        return folders.filter(f => f.parent_folder_id === filters.folderId);
    }, [folders, filters.folderId]);
    const handleCreateNew = useCallback(() => {
        navigate('/page-builder?repo=wods');
    }, [navigate]);
    const handleWodClick = useCallback((wodId) => {
        navigate(`/page-builder?repo=wods&id=${wodId}`);
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
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-red-500 mb-4", children: _jsx(Dumbbell, { className: "h-12 w-12 mx-auto" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Error Loading WODs" }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: error }), _jsx("button", { onClick: () => {
                            setError(null);
                            fetchData();
                        }, className: "px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700", children: "Try Again" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-full flex bg-gray-50", children: [_jsxs("div", { className: `transition-all duration-300 ${showFilters ? 'w-80' : 'w-12'} bg-white border-r border-gray-200 flex flex-col shadow-sm`, children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: "flex items-center justify-center w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors", children: [_jsx(Filter, { className: "h-5 w-5" }), showFilters && _jsx("span", { className: "ml-2 text-sm font-medium", children: "Filters" })] }) }), showFilters && (_jsxs("div", { className: "flex-1 p-4 space-y-6 overflow-y-auto", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search WODs" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }), _jsx("input", { type: "text", placeholder: "Search by title or description...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm" })] })] }), _jsx("div", { children: _jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: filters.showFavorites, onChange: (e) => handleFilterChange('showFavorites', e.target.checked), className: "rounded border-gray-300 text-orange-600 focus:ring-orange-500" }), _jsx(Star, { className: "h-4 w-4 text-orange-500" }), _jsx("span", { className: "text-sm text-gray-900", children: "Show Favorites Only" })] }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Publication Status" }), _jsxs("select", { value: filters.status, onChange: (e) => handleFilterChange('status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "published", children: "Published Only" }), _jsx("option", { value: "draft", children: "Drafts Only" }), _jsx("option", { value: "archived", children: "Archived Only" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Difficulty Level" }), _jsxs("select", { value: filters.difficulty, onChange: (e) => handleFilterChange('difficulty', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm", children: [_jsx("option", { value: "all", children: "All Levels" }), _jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] }), communities.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Filter by Communities" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2", children: communities.map((community) => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: filters.communities.includes(community.id), onChange: (e) => {
                                                        if (e.target.checked) {
                                                            handleFilterChange('communities', [...filters.communities, community.id]);
                                                        }
                                                        else {
                                                            handleFilterChange('communities', filters.communities.filter(id => id !== community.id));
                                                        }
                                                    }, className: "rounded border-gray-300 text-orange-600 focus:ring-orange-500" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: community.brand_color } }), _jsx("span", { className: "text-sm text-gray-900", children: community.name })] })] }, community.id))) })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Sort WODs" }), _jsxs("select", { value: `${filters.sortBy}_${filters.sortOrder}`, onChange: (e) => {
                                            const [sortBy, sortOrder] = e.target.value.split('_');
                                            handleFilterChange('sortBy', sortBy);
                                            handleFilterChange('sortOrder', sortOrder);
                                        }, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm", children: [_jsx("option", { value: "updated_at_desc", children: "Last Updated (Newest)" }), _jsx("option", { value: "updated_at_asc", children: "Last Updated (Oldest)" }), _jsx("option", { value: "created_at_desc", children: "Date Created (Newest)" }), _jsx("option", { value: "created_at_asc", children: "Date Created (Oldest)" }), _jsx("option", { value: "title_asc", children: "Title (A-Z)" }), _jsx("option", { value: "title_desc", children: "Title (Z-A)" })] })] }), _jsx("div", { className: "pt-4 border-t border-gray-200", children: _jsx("button", { onClick: clearAllFilters, className: "w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors", children: "Clear All Filters" }) })] }))] }), _jsxs("div", { className: "flex-1 flex flex-col", children: [_jsxs("div", { className: "bg-white border-b border-gray-200 px-6 py-4 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-orange-100", children: _jsx(Dumbbell, { className: "h-6 w-6 text-orange-600" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "WODs (Workouts of the Day)" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Create and manage fitness challenges and workout programs" }), _jsxs("div", { className: "flex items-center space-x-4 mt-2", children: [_jsxs("span", { className: "text-xs text-gray-500", children: [wods.length, " ", wods.length === 1 ? 'WOD' : 'WODs'] }), filters.status !== 'all' && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 Filtered by ", filters.status] })), filters.difficulty !== 'all' && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 ", filters.difficulty, " level"] })), filters.communities.length > 0 && (_jsxs("span", { className: "text-xs text-gray-500", children: ["\u2022 ", filters.communities.length, " community(s)"] }))] })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex bg-gray-100 rounded-lg p-1", children: [_jsx("button", { onClick: () => handleFilterChange('viewMode', 'cards'), className: `p-2 rounded-md transition-colors ${filters.viewMode === 'cards'
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'}`, title: "Card View", children: _jsx(Grid, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleFilterChange('viewMode', 'list'), className: `p-2 rounded-md transition-colors ${filters.viewMode === 'list'
                                                            ? 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'}`, title: "List View", children: _jsx(List, { className: "h-4 w-4" }) })] }), _jsxs("button", { onClick: () => setShowFolderModal(true), className: "inline-flex items-center px-3 py-2 border border-orange-300 text-sm font-medium rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all", children: [_jsx(FolderPlus, { className: "-ml-1 mr-2 h-4 w-4" }), "New Folder"] }), _jsxs("button", { onClick: handleCreateNew, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create WOD"] })] })] }), (breadcrumbPath.length > 0 || filters.folderId !== null) && (_jsxs("div", { className: "flex items-center space-x-2 mt-4 text-sm text-gray-600", children: [_jsxs("button", { onClick: () => handleNavigateToFolder(null), className: "flex items-center hover:text-orange-600 transition-colors", children: [_jsx(Home, { className: "h-4 w-4 mr-1" }), "Root"] }), breadcrumbPath.map((folder, index) => (_jsxs(React.Fragment, { children: [_jsx(ChevronRight, { className: "h-4 w-4" }), _jsx("button", { onClick: () => handleNavigateToFolder(folder.id), className: `hover:text-orange-600 transition-colors ${index === breadcrumbPath.length - 1 ? 'font-medium text-gray-900' : ''}`, children: folder.name })] }, folder.id)))] })), selectedItems.size > 0 && (_jsxs("div", { className: "flex items-center justify-between mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200", children: [_jsxs("span", { className: "text-sm text-orange-800", children: [selectedItems.size, " item", selectedItems.size !== 1 ? 's' : '', " selected"] }), _jsx("button", { onClick: handleClearSelection, className: "text-sm text-orange-600 hover:text-orange-800", children: "Clear selection" })] }))] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex justify-center items-center py-20", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading WODs..." })] }) })) : (_jsxs(_Fragment, { children: [currentFolders.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-3", children: "Folders" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6", children: currentFolders.map((folder) => (_jsxs("button", { onClick: () => handleNavigateToFolder(folder.id), className: "flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-colors group", children: [_jsx(Folder, { className: "h-12 w-12 text-orange-500 mb-2 group-hover:text-orange-600" }), _jsx("span", { className: "text-sm text-center text-gray-900 truncate w-full", children: folder.name })] }, folder.id))) })] })), wods.length === 0 && currentFolders.length === 0 ? (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "bg-orange-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4", children: _jsx(Dumbbell, { className: "h-12 w-12 text-orange-600" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "No WODs found" }), _jsx("p", { className: "text-sm text-gray-500 mt-2 max-w-sm mx-auto", children: filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.communities.length > 0
                                                ? 'Try adjusting your filters to find more results.'
                                                : 'Get started by creating your first workout of the day.' }), _jsx("div", { className: "mt-6", children: _jsxs("button", { onClick: handleCreateNew, className: "inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create WOD"] }) })] })) : (_jsxs(_Fragment, { children: [wods.length > 0 && (_jsx("div", { className: "mb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "WODs" }), wods.length > 0 && (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedItems.size === wods.length && wods.length > 0, onChange: (e) => handleSelectAll(e.target.checked), className: "rounded border-gray-300 text-orange-600 focus:ring-orange-500" }), _jsx("span", { className: "text-sm text-gray-600", children: "Select all" })] }))] }) })), _jsx("div", { className: filters.viewMode === 'cards'
                                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                                                : 'space-y-4', children: wods.map((wod) => (_jsxs("div", { className: `relative group transition-all ${filters.viewMode === 'cards'
                                                    ? 'border border-gray-200 rounded-lg overflow-hidden hover:shadow-md bg-white'
                                                    : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white'}`, children: [_jsx("div", { className: "absolute top-3 left-3 z-10", children: _jsx("label", { className: "cursor-pointer", children: _jsx("input", { type: "checkbox", checked: selectedItems.has(wod.id), onChange: (e) => handleSelectItem(wod.id, e.target.checked), className: "rounded border-gray-300 text-orange-600 focus:ring-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" }) }) }), _jsx("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            handleToggleFavorite(wod.id);
                                                        }, className: `absolute ${filters.viewMode === 'cards' ? 'top-3 right-12' : 'top-3 right-12'} z-10 p-1 rounded-full hover:bg-white hover:bg-opacity-80 transition-all`, children: wod.is_favorite ? (_jsx(Star, { className: "h-5 w-5 text-orange-500 fill-current" })) : (_jsx(StarOff, { className: "h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" })) }), _jsx("div", { className: `absolute ${filters.viewMode === 'cards' ? 'top-3 right-3' : 'top-3 right-3'} z-10`, children: _jsx(ItemContextMenu, { isFavorited: wod.is_favorite, repositoryType: "wods", onCopy: () => handleCopyItem(wod.id), onDelete: () => handleDeleteItem(wod.id), onMoveToFolder: () => handleMoveToFolder(wod.id), onToggleFavorite: () => handleToggleFavorite(wod.id), size: "sm" }) }), _jsx("div", { onClick: () => handleWodClick(wod.id), className: "cursor-pointer flex-1", children: filters.viewMode === 'cards' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "aspect-video bg-gray-200 relative overflow-hidden", children: [wod.thumbnail_url ? (_jsx("img", { src: wod.thumbnail_url, alt: wod.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center", children: _jsx(Dumbbell, { className: "h-8 w-8 text-white" }) })), _jsx("div", { className: "absolute bottom-2 left-2 flex space-x-1", children: getStatusBadge(wod.status) })] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2", children: wod.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1 line-clamp-2", children: wod.description || 'No description provided' }), _jsx("div", { className: "flex items-center justify-between mt-3", children: _jsxs("div", { className: "flex items-center space-x-2", children: [wod.difficulty_level && getDifficultyBadge(wod.difficulty_level), wod.estimated_duration_minutes && (_jsxs("span", { className: "inline-flex items-center text-xs text-gray-500", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDuration(wod.estimated_duration_minutes)] }))] }) })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0", children: wod.thumbnail_url ? (_jsx("img", { src: wod.thumbnail_url, alt: wod.title, className: "w-full h-full object-cover rounded-lg" })) : (_jsx(Dumbbell, { className: "h-6 w-6 text-gray-500" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-semibold text-gray-900 truncate", children: wod.title }), _jsx("p", { className: "text-sm text-gray-600 truncate", children: wod.description || 'No description provided' }), _jsxs("div", { className: "flex items-center space-x-3 mt-2", children: [getStatusBadge(wod.status), wod.difficulty_level && getDifficultyBadge(wod.difficulty_level), wod.estimated_duration_minutes && (_jsxs("span", { className: "inline-flex items-center text-xs text-gray-500", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDuration(wod.estimated_duration_minutes)] })), _jsxs("span", { className: "text-xs text-gray-500", children: ["Updated ", formatDate(wod.updated_at)] })] })] })] })) })] }, wod.id))) })] }))] })) })] }), selectedItems.size > 0 && (_jsx(BulkActionBar, { selectedCount: selectedItems.size, folders: folders.filter(f => f.repository_type === 'wods'), repositoryType: "wods", onClearSelection: handleClearSelection, onDeleteSelected: handleBulkDelete, onCopySelected: handleBulkCopy, onMoveToFolder: handleBulkMove, onCreateFolderAndMove: handleCreateFolderAndMove })), _jsx(FolderCreateModal, { isOpen: showFolderModal, onClose: () => setShowFolderModal(false), onCreateFolder: handleCreateFolder, folders: folders.filter(f => f.repository_type === 'wods'), repositoryType: "wods", isCreating: folderCreating, error: folderError }), _jsx(MoveToFolderModal, { isOpen: showMoveModal, onClose: () => {
                    setShowMoveModal(false);
                    setMoveItem(null);
                }, onMoveToFolder: handleSingleItemMove, folders: folders.filter(f => f.repository_type === 'wods'), repositoryType: "wods", isMoving: itemMoving, itemName: moveItem?.name || 'item' })] }));
}
export default WodsRepository;
