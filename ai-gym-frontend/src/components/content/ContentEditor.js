import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChevronRight, ChevronDown, Save, Trash2, ArrowLeft, Users, Tag as TagIcon, Settings, X } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
function AssignmentModal({ isOpen, onClose, community, contentItemId, onSave }) {
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [tags, setTags] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (isOpen) {
            fetchAssignmentData();
        }
    }, [isOpen, community.id]);
    const fetchAssignmentData = async () => {
        try {
            setLoading(true);
            // Fetch tags for this community
            const { data: tagsData, error: tagsError } = await supabase
                .from('user_tags')
                .select('*')
                .eq('community_id', community.id)
                .order('name');
            if (tagsError) {
                console.error('Error fetching tags:', tagsError);
            }
            else if (tagsData) {
                setTags(tagsData);
            }
            // Fetch users for this community
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .eq('community_id', community.id)
                .order('first_name');
            if (usersError) {
                console.error('Error fetching users:', usersError);
            }
            else if (usersData) {
                setUsers(usersData);
            }
            // Fetch current assignments
            const [tagAssignments, userAssignments] = await Promise.all([
                supabase.from('content_tag_assignments').select('tag_id').eq('content_item_id', contentItemId),
                supabase.from('content_user_assignments').select('user_id').eq('content_item_id', contentItemId)
            ]);
            if (tagAssignments.data) {
                setSelectedTags(tagAssignments.data.map(a => a.tag_id));
            }
            if (userAssignments.data) {
                setSelectedUsers(userAssignments.data.map(a => a.user_id));
            }
        }
        catch (error) {
            console.error('Error fetching assignment data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                return;
            // Delete existing assignments for this client's content
            const deletePromises = [];
            if (tags.length > 0) {
                deletePromises.push(supabase
                    .from('content_tag_assignments')
                    .delete()
                    .eq('content_item_id', contentItemId)
                    .in('tag_id', tags.map(t => t.id)));
            }
            if (users.length > 0) {
                deletePromises.push(supabase
                    .from('content_user_assignments')
                    .delete()
                    .eq('content_item_id', contentItemId)
                    .in('user_id', users.map(u => u.id)));
            }
            await Promise.all(deletePromises);
            // Insert new assignments
            const insertPromises = [];
            if (selectedTags.length > 0) {
                const tagAssignments = selectedTags.map(tagId => ({
                    content_item_id: contentItemId,
                    tag_id: tagId,
                    assigned_by: user.id
                }));
                insertPromises.push(supabase.from('content_tag_assignments').insert(tagAssignments));
            }
            if (selectedUsers.length > 0) {
                const userAssignments = selectedUsers.map(userId => ({
                    content_item_id: contentItemId,
                    user_id: userId,
                    assigned_by: user.id
                }));
                insertPromises.push(supabase.from('content_user_assignments').insert(userAssignments));
            }
            await Promise.all(insertPromises);
            onSave();
            onClose();
        }
        catch (error) {
            console.error('Error saving assignments:', error);
        }
        finally {
            setSaving(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "h-8 w-8 rounded-lg flex items-center justify-center", style: { backgroundColor: community.brand_color + '20' }, children: _jsx("div", { className: "h-4 w-4 rounded-full", style: { backgroundColor: community.brand_color } }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900", children: ["Assign to ", community.name] }), _jsx("p", { className: "text-sm text-gray-500", children: "Configure content visibility and access" })] })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(X, { className: "h-5 w-5" }) })] }), loading ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx(LoadingSpinner, { size: "md" }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: "Loading assignment options..." })] })) : (_jsxs("div", { className: "p-6 space-y-6", children: [tags.length > 0 && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: [_jsx(TagIcon, { className: "h-4 w-4 inline mr-2" }), "Assign to User Tags (", selectedTags.length, " selected)"] }), _jsx("div", { className: "grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3", children: tags.map((tag) => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md", children: [_jsx("input", { type: "checkbox", checked: selectedTags.includes(tag.id), onChange: (e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTags([...selectedTags, tag.id]);
                                                    }
                                                    else {
                                                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                                                    }
                                                }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: tag.color } }), _jsx("span", { className: "text-sm text-gray-900", children: tag.name })] })] }, tag.id))) }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Content will be visible to all users with the selected tags" })] })), users.length > 0 && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: [_jsx(Users, { className: "h-4 w-4 inline mr-2" }), "Assign to Specific Users (", selectedUsers.length, " selected)"] }), _jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3", children: users.map((user) => (_jsxs("label", { className: "flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-md", children: [_jsx("input", { type: "checkbox", checked: selectedUsers.includes(user.id), onChange: (e) => {
                                                    if (e.target.checked) {
                                                        setSelectedUsers([...selectedUsers, user.id]);
                                                    }
                                                    else {
                                                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                    }
                                                }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "text-sm font-medium text-gray-900", children: [user.first_name, " ", user.last_name] }), _jsx("div", { className: "text-xs text-gray-500", children: user.email })] })] }, user.id))) }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Content will be visible to the specifically selected users" })] })), tags.length === 0 && users.length === 0 && (_jsxs("div", { className: "text-center py-8", children: [_jsx(Users, { className: "h-12 w-12 text-gray-300 mx-auto mb-3" }), _jsx("h3", { className: "text-sm font-medium text-gray-900", children: "No assignment options" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "This community has no users or tags configured. Set up users and tags first." })] }))] })), _jsxs("div", { className: "flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50", children: [_jsx("button", { onClick: onClose, disabled: saving, className: "px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: "Cancel" }), _jsxs("button", { onClick: handleSave, disabled: saving || (tags.length === 0 && users.length === 0), className: "inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [saving ? (_jsx(LoadingSpinner, { size: "sm", className: "mr-2" })) : null, "Save Assignments"] })] })] }) }));
}
export function ContentEditor({ contentType, isEdit = false, children, onSaveContent, title, description, color, icon: Icon }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [contentItem, setContentItem] = useState(null);
    const [communities, setCommunities] = useState([]);
    const [assignedCommunities, setAssignedCommunities] = useState([]);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeAssignmentModal, setActiveAssignmentModal] = useState(null);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [error, setError] = useState(null);
    // Basic form state
    const [itemTitle, setItemTitle] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [status, setStatus] = useState('draft');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    // Track initial values to detect changes
    const initialValuesRef = useRef(null);
    // Memoized function to detect changes
    const detectChanges = useCallback(() => {
        if (!initialValuesRef.current)
            return false;
        const initial = initialValuesRef.current;
        return (itemTitle !== initial.title ||
            itemDescription !== initial.description ||
            status !== initial.status ||
            thumbnailUrl !== initial.thumbnailUrl ||
            JSON.stringify(assignedCommunities.slice().sort()) !== JSON.stringify(initial.assignedCommunities.slice().sort()));
    }, [itemTitle, itemDescription, status, thumbnailUrl, assignedCommunities]);
    // Update hasChanges when form values change (with debouncing to prevent infinite loops)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const newHasChanges = detectChanges();
            if (newHasChanges !== hasChanges) {
                setHasChanges(newHasChanges);
            }
        }, 50); // 50ms debounce
        return () => clearTimeout(timeoutId);
    }, [itemTitle, itemDescription, status, thumbnailUrl, assignedCommunities, hasChanges, detectChanges]);
    useEffect(() => {
        let isMounted = true;
        const initializeComponent = async () => {
            try {
                setError(null);
                if (isEdit && id) {
                    await fetchContentItem();
                }
                if (isMounted) {
                    await fetchCommunities();
                }
            }
            catch (err) {
                if (isMounted) {
                    console.error('Error initializing ContentEditor:', err);
                    setError(err instanceof Error ? err.message : 'Failed to load content');
                }
            }
        };
        initializeComponent();
        return () => {
            isMounted = false;
        };
    }, [isEdit, id]);
    const fetchContentItem = useCallback(async () => {
        if (!id)
            return;
        try {
            setError(null);
            const { data, error } = await supabase
                .from('content_items')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (error)
                throw error;
            if (!data) {
                console.warn('Content item not found, redirecting to content list');
                navigate('/content', { replace: true });
                return;
            }
            // Set content item data
            setContentItem(data);
            // Set form values
            const title = data.title || '';
            const description = data.description || '';
            const itemStatus = data.status || 'draft';
            const thumbnail = data.thumbnail_url || '';
            setItemTitle(title);
            setItemDescription(description);
            setStatus(itemStatus);
            setThumbnailUrl(thumbnail);
            // Fetch assigned communities
            const { data: assignments, error: assignmentsError } = await supabase
                .from('content_community_assignments')
                .select('community_id')
                .eq('content_item_id', data.id);
            if (assignmentsError) {
                console.error('Error fetching community assignments:', assignmentsError);
            }
            const communityIds = assignments ? assignments.map(a => a.community_id) : [];
            setAssignedCommunities(communityIds);
            // Set initial values for change detection
            initialValuesRef.current = {
                title,
                description,
                status: itemStatus,
                thumbnailUrl: thumbnail,
                assignedCommunities: communityIds
            };
            setHasChanges(false); // Reset changes flag after loading
        }
        catch (error) {
            console.error('Error fetching content item:', error);
            setError(error instanceof Error ? error.message : 'Failed to load content item');
            // Don't navigate away on error - let user retry
        }
        finally {
            setLoading(false);
        }
    }, [id, navigate]);
    const fetchCommunities = useCallback(async () => {
        try {
            setError(null);
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .eq('status', 'active')
                .order('name');
            if (error)
                throw error;
            setCommunities(data || []);
            // Set initial values for new items
            if (!isEdit && !initialValuesRef.current) {
                initialValuesRef.current = {
                    title: '',
                    description: '',
                    status: 'draft',
                    thumbnailUrl: '',
                    assignedCommunities: []
                };
            }
        }
        catch (error) {
            console.error('Error fetching communities:', error);
            setError(error instanceof Error ? error.message : 'Failed to load communities');
        }
    }, [isEdit]);
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
    const saveCommunityAssignments = useCallback(async (contentItemId) => {
        if (!user) {
            throw new Error('Authentication required');
        }
        try {
            // Delete existing community assignments
            const { error: deleteError } = await supabase
                .from('content_community_assignments')
                .delete()
                .eq('content_item_id', contentItemId);
            if (deleteError)
                throw deleteError;
            // Insert new community assignments
            if (assignedCommunities.length > 0) {
                const assignments = assignedCommunities.map(communityId => ({
                    content_item_id: contentItemId,
                    community_id: communityId,
                    assigned_by: user.id
                }));
                const { error: insertError } = await supabase
                    .from('content_community_assignments')
                    .insert(assignments);
                if (insertError)
                    throw insertError;
            }
        }
        catch (error) {
            console.error('Error saving community assignments:', error);
            throw new Error('Failed to save community assignments');
        }
    }, [user, assignedCommunities]);
    const handleDelete = useCallback(async () => {
        if (!contentItem || !user) {
            setError('Unable to delete: missing content item or authentication');
            return;
        }
        if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
            return;
        }
        try {
            setSaving(true);
            setError(null);
            // Delete the content item (cascading deletes will handle related records)
            const { error } = await supabase
                .from('content_items')
                .delete()
                .eq('id', contentItem.id);
            if (error)
                throw error;
            // Navigate back to content list
            const routePrefix = getRoutePrefix();
            navigate(`/content/${routePrefix}`, { replace: true });
        }
        catch (error) {
            console.error('Error deleting content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error deleting content. Please try again.';
            setError(errorMessage);
        }
        finally {
            setSaving(false);
        }
    }, [contentItem, user, navigate]);
    const handleSave = useCallback(async () => {
        if (!user) {
            setError('Admin authentication required');
            return;
        }
        try {
            setSaving(true);
            setError(null);
            let contentItemId = id;
            const contentData = {
                title: itemTitle.trim(),
                description: itemDescription.trim() || null,
                content_type: contentType,
                status,
                thumbnail_url: thumbnailUrl.trim() || null,
                created_by: user.id,
                updated_at: new Date().toISOString()
            };
            if (isEdit && contentItemId) {
                // Update existing content item
                const { error } = await supabase
                    .from('content_items')
                    .update(contentData)
                    .eq('id', contentItemId);
                if (error)
                    throw error;
            }
            else {
                // Create new content item
                const { data, error } = await supabase
                    .from('content_items')
                    .insert([{ ...contentData, created_at: new Date().toISOString() }])
                    .select()
                    .single();
                if (error)
                    throw error;
                if (data) {
                    contentItemId = data.id;
                    setContentItem(data);
                }
            }
            // Save content-specific data
            if (onSaveContent && contentItemId) {
                await onSaveContent(contentItemId);
            }
            // Save client assignments
            await saveCommunityAssignments(contentItemId);
            // Update initial values for change detection
            initialValuesRef.current = {
                title: itemTitle.trim(),
                description: itemDescription.trim(),
                status,
                thumbnailUrl: thumbnailUrl.trim(),
                assignedCommunities: [...assignedCommunities]
            };
            setHasChanges(false);
            // Navigate to edit mode if this was a create
            if (!isEdit && contentItemId) {
                const routePrefix = getRoutePrefix();
                navigate(`/content/${routePrefix}/${contentItemId}/edit`, { replace: true });
            }
        }
        catch (error) {
            console.error('Error saving content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error saving content. Please try again.';
            setError(errorMessage);
        }
        finally {
            setSaving(false);
        }
    }, [user, id, itemTitle, itemDescription, contentType, status, thumbnailUrl, onSaveContent, assignedCommunities, isEdit, navigate]);
    const handleSaveAndReturn = useCallback(async () => {
        if (!user) {
            setError('Admin authentication required');
            return;
        }
        try {
            setSaving(true);
            setError(null);
            let contentItemId = id;
            const contentData = {
                title: itemTitle.trim(),
                description: itemDescription.trim() || null,
                content_type: contentType,
                status,
                thumbnail_url: thumbnailUrl.trim() || null,
                created_by: user.id,
                updated_at: new Date().toISOString()
            };
            if (isEdit && contentItemId) {
                // Update existing content item
                const { error } = await supabase
                    .from('content_items')
                    .update(contentData)
                    .eq('id', contentItemId);
                if (error)
                    throw error;
            }
            else {
                // Create new content item
                const { data, error } = await supabase
                    .from('content_items')
                    .insert([{ ...contentData, created_at: new Date().toISOString() }])
                    .select()
                    .single();
                if (error)
                    throw error;
                if (data) {
                    contentItemId = data.id;
                    setContentItem(data);
                }
            }
            // Save content-specific data
            if (onSaveContent && contentItemId) {
                await onSaveContent(contentItemId);
            }
            // Save client assignments
            await saveCommunityAssignments(contentItemId);
            setHasChanges(false);
            // Return to repository list
            const routePrefix = getRoutePrefix();
            navigate(`/content/${routePrefix}`, { replace: true });
        }
        catch (error) {
            console.error('Error saving content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error saving content. Please try again.';
            setError(errorMessage);
        }
        finally {
            setSaving(false);
        }
    }, [user, id, itemTitle, itemDescription, contentType, status, thumbnailUrl, onSaveContent, assignedCommunities, navigate]);
    const toggleCommunityAssignment = useCallback((communityId) => {
        setAssignedCommunities(prev => {
            const newAssignments = prev.includes(communityId)
                ? prev.filter(id => id !== communityId)
                : [...prev, communityId];
            return newAssignments;
        });
    }, []);
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading content..." })] }) }) }));
    }
    // Show error state with retry option
    if (error) {
        return (_jsx(Layout, { children: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "text-center max-w-md mx-auto", children: _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6", children: [_jsxs("div", { className: "text-red-800 mb-4", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Error Loading Content" }), _jsx("p", { className: "text-sm", children: error })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: () => {
                                            setError(null);
                                            if (isEdit && id) {
                                                fetchContentItem();
                                            }
                                            fetchCommunities();
                                        }, className: "w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500", children: "Try Again" }), _jsx(Link, { to: "/content", className: "block w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-center", children: "Back to Content" })] })] }) }) }) }));
    }
    return (_jsx(ErrorBoundary, { onError: (error, errorInfo) => {
            console.error('ContentEditor Error Boundary:', error, errorInfo);
            setError(`Component Error: ${error.message}`);
        }, children: _jsx(Layout, { children: _jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200 shadow-sm", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex items-center justify-between py-4", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Link, { to: `/content/${getRoutePrefix()}`, className: "p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }), _jsx("div", { className: "h-8 w-8 rounded-lg flex items-center justify-center", style: { backgroundColor: color + '20' }, children: _jsx(Icon, { className: "h-5 w-5", style: { color } }) }), _jsxs("div", { children: [_jsxs("h1", { className: "text-xl font-semibold text-gray-900", children: [isEdit ? 'Edit' : 'Create', " ", title.slice(0, -1)] }), _jsx("p", { className: "text-sm text-gray-500", children: description })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [isEdit && (_jsxs("button", { onClick: handleDelete, disabled: saving, className: "inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50", children: [_jsx(Trash2, { className: "h-4 w-4 mr-1" }), "Delete"] })), !isEdit && (_jsxs("button", { onClick: handleSaveAndReturn, disabled: saving || !itemTitle.trim(), className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [saving ? (_jsx(LoadingSpinner, { size: "sm", className: "mr-2" })) : (_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" })), saving ? 'Saving...' : 'Save & Return to List'] })), _jsxs("button", { onClick: handleSave, disabled: saving || !itemTitle.trim(), className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50", style: { backgroundColor: color }, children: [saving ? (_jsx(LoadingSpinner, { size: "sm", className: "mr-2" })) : (_jsx(Save, { className: "h-4 w-4 mr-2" })), saving ? 'Saving...' : (isEdit ? 'Update' : 'Save & Continue Editing')] })] })] }) }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Basic Information" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-gray-700 mb-2", children: "Title *" }), _jsx("input", { type: "text", id: "title", value: itemTitle, onChange: (e) => setItemTitle(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: `Enter ${title.slice(0, -1).toLowerCase()} title...`, required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }), _jsx("textarea", { id: "description", rows: 3, value: itemDescription, onChange: (e) => setItemDescription(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: `Brief description of this ${title.slice(0, -1).toLowerCase()}...` })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "thumbnail", className: "block text-sm font-medium text-gray-700 mb-2", children: "Thumbnail URL" }), _jsx("input", { type: "url", id: "thumbnail", value: thumbnailUrl, onChange: (e) => setThumbnailUrl(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "https://example.com/image.jpg" })] })] })] }), children] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Status & Visibility" }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Publication Status" }), _jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "draft", children: "\uD83D\uDCDD Draft" }), _jsx("option", { value: "published", children: "\uD83D\uDC41\uFE0F Published" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: status === 'draft'
                                                                    ? 'Only visible to user users'
                                                                    : 'Visible to assigned communities and users' })] }) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Community Assignment" }), _jsxs("span", { className: "text-sm text-gray-500", children: [assignedCommunities.length, " of ", communities.length] })] }), communities.length > 0 ? (_jsx("div", { className: "space-y-3", children: communities.map((community) => {
                                                        const isAssigned = assignedCommunities.includes(community.id);
                                                        return (_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "checkbox", checked: isAssigned, onChange: () => toggleCommunityAssignment(community.id), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-4 h-4 rounded-full", style: { backgroundColor: community.brand_color } }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: community.name })] })] }), isAssigned && (_jsx("button", { onClick: () => setActiveAssignmentModal(community.id), className: "text-xs text-blue-600 hover:text-blue-800 font-medium", children: "Configure" }))] }, community.id));
                                                    }) })) : (_jsxs("div", { className: "text-center py-4", children: [_jsx(Users, { className: "h-8 w-8 text-gray-300 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-gray-500", children: "No communities available" })] }))] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200", children: [_jsxs("button", { onClick: () => setShowAdvancedSettings(!showAdvancedSettings), className: "w-full flex items-center justify-between p-6 text-left", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Settings, { className: "h-5 w-5 text-gray-600" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Advanced Settings" })] }), showAdvancedSettings ? (_jsx(ChevronDown, { className: "h-5 w-5 text-gray-600" })) : (_jsx(ChevronRight, { className: "h-5 w-5 text-gray-600" }))] }), showAdvancedSettings && (_jsx("div", { className: "px-6 pb-6 border-t border-gray-200", children: _jsx("div", { className: "pt-4 space-y-4", children: _jsxs("div", { className: "text-sm text-gray-600", children: [_jsxs("p", { children: ["Content ID: ", _jsx("code", { className: "text-xs bg-gray-100 px-2 py-1 rounded", children: contentItem?.id || 'Not created yet' })] }), _jsxs("p", { children: ["Content Type: ", _jsx("code", { className: "text-xs bg-gray-100 px-2 py-1 rounded", children: contentType })] }), contentItem && (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["Created: ", new Date(contentItem.created_at).toLocaleString()] }), _jsxs("p", { children: ["Updated: ", new Date(contentItem.updated_at).toLocaleString()] })] }))] }) }) }))] })] })] }) }), activeAssignmentModal && (_jsx(ErrorBoundary, { children: _jsx(AssignmentModal, { isOpen: true, onClose: () => setActiveAssignmentModal(null), community: communities.find(c => c.id === activeAssignmentModal), contentItemId: contentItem?.id || id, onSave: () => {
                                // Refresh assignment data if needed
                            } }) }))] }) }) }));
}
export default ContentEditor;
