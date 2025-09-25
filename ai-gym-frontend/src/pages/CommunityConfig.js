import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, ToggleLeft, ToggleRight, Tag, Users, Plus, Edit2, Trash2, Upload, Search, ArrowLeft, Save, AlertTriangle, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CSVUploadModal from '../components/modals/CSVUploadModal';
const PLATFORM_FEATURES = [
    { key: 'agents_marketplace', label: 'AI Agents Marketplace', description: 'Access to AI agents and custom prompts' },
    { key: 'courses', label: 'Courses', description: 'Structured learning courses and programs' },
    { key: 'missions', label: 'Missions', description: 'Gamified learning missions and challenges' },
    { key: 'forums', label: 'Forums', description: 'Community discussion forums' },
    { key: 'documents', label: 'Documents', description: 'Rich text documents and guides' },
    { key: 'prompts', label: 'Prompts', description: 'Reusable prompt templates' },
    { key: 'automations', label: 'Automations', description: 'Process automations and workflows' }
];
const CommunityConfig = () => {
    const { communityId } = useParams();
    const navigate = useNavigate();
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('settings');
    const [saving, setSaving] = useState(false);
    // Settings tab state
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        project_name: '',
        brand_color: '',
        forum_enabled: true
    });
    const [settingsChanged, setSettingsChanged] = useState(false);
    // Features tab state
    const [features, setFeatures] = useState([]);
    // Tags tab state
    const [tags, setTags] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3B82F6');
    const [editingTag, setEditingTag] = useState(null);
    const [tagToDelete, setTagToDelete] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    // Users tab state
    const [users, setUsers] = useState([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [selectedTagFilter, setSelectedTagFilter] = useState('all');
    const [csvUploadOpen, setCsvUploadOpen] = useState(false);
    const [createUserOpen, setCreateUserOpen] = useState(false);
    const loadCommunity = useCallback(async () => {
        if (!communityId)
            return;
        try {
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .eq('id', communityId)
                .single();
            if (error)
                throw error;
            if (!data)
                throw new Error('Community not found');
            setCommunity(data);
            setSettingsForm({
                name: data.name,
                project_name: data.project_name || '',
                brand_color: data.brand_color || '#3B82F6',
                forum_enabled: data.forum_enabled
            });
            // Initialize features
            await initializeFeatures(data.id);
        }
        catch (error) {
            console.error('Error loading community:', error);
            navigate('/communities');
        }
        finally {
            setLoading(false);
        }
    }, [communityId, navigate]);
    const initializeFeatures = async (communityId) => {
        try {
            // Get existing features
            const { data: existingFeatures } = await supabase
                .from('community_features')
                .select('*')
                .eq('community_id', communityId);
            const featureMap = new Map(existingFeatures?.map(f => [f.feature_name, f]) || []);
            // Create features array with defaults
            const allFeatures = PLATFORM_FEATURES.map(feature => ({
                id: featureMap.get(feature.key)?.id || '',
                feature_name: feature.key,
                enabled: featureMap.get(feature.key)?.enabled ?? true
            }));
            setFeatures(allFeatures);
        }
        catch (error) {
            console.error('Error initializing features:', error);
        }
    };
    const loadTags = useCallback(async () => {
        if (!communityId)
            return;
        try {
            const { data, error } = await supabase.functions.invoke('manage-user-tags', {
                body: { community_id: communityId, action: 'list' }
            });
            if (error)
                throw error;
            setTags(data || []);
        }
        catch (error) {
            console.error('Error loading tags:', error);
        }
    }, [communityId]);
    const loadUsers = useCallback(async () => {
        if (!communityId)
            return;
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
          *,
          user_tag_assignments(
            user_tags(
              id,
              name,
              color
            )
          )
        `)
                .eq('community_id', communityId)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            const usersWithTags = data?.map(user => ({
                ...user,
                tags: user.user_tag_assignments?.map((assignment) => assignment.user_tags) || []
            })) || [];
            setUsers(usersWithTags);
        }
        catch (error) {
            console.error('Error loading users:', error);
        }
    }, [communityId]);
    useEffect(() => {
        loadCommunity();
    }, [loadCommunity]);
    useEffect(() => {
        if (activeTab === 'tags') {
            loadTags();
        }
        else if (activeTab === 'users') {
            loadUsers();
        }
    }, [activeTab, loadTags, loadUsers]);
    const handleSettingsChange = (field, value) => {
        setSettingsForm(prev => ({ ...prev, [field]: value }));
        setSettingsChanged(true);
    };
    const saveSettings = async () => {
        if (!community)
            return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('communities')
                .update({
                name: settingsForm.name,
                project_name: settingsForm.project_name || null,
                brand_color: settingsForm.brand_color,
                forum_enabled: settingsForm.forum_enabled
            })
                .eq('id', community.id);
            if (error)
                throw error;
            setCommunity(prev => prev ? { ...prev, ...settingsForm } : null);
            setSettingsChanged(false);
            // Show success toast (you can replace with your toast system)
            alert('Settings saved successfully!');
        }
        catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings');
        }
        finally {
            setSaving(false);
        }
    };
    const toggleFeature = async (featureIndex) => {
        const feature = features[featureIndex];
        const newEnabled = !feature.enabled;
        try {
            if (feature.id) {
                // Update existing feature
                const { error } = await supabase
                    .from('community_features')
                    .update({ enabled: newEnabled })
                    .eq('id', feature.id);
                if (error)
                    throw error;
            }
            else {
                // Create new feature
                const { data, error } = await supabase
                    .from('community_features')
                    .insert({
                    community_id: communityId,
                    feature_name: feature.feature_name,
                    enabled: newEnabled
                })
                    .select()
                    .single();
                if (error)
                    throw error;
                // Update local state with ID
                setFeatures(prev => prev.map((f, i) => i === featureIndex ? { ...f, id: data.id, enabled: newEnabled } : f));
                return;
            }
            // Update local state
            setFeatures(prev => prev.map((f, i) => i === featureIndex ? { ...f, enabled: newEnabled } : f));
            // Show success toast
            const featureLabel = PLATFORM_FEATURES.find(f => f.key === feature.feature_name)?.label || feature.feature_name;
            alert(`${featureLabel} ${newEnabled ? 'enabled' : 'disabled'}`);
        }
        catch (error) {
            console.error('Error toggling feature:', error);
            alert('Error updating feature');
        }
    };
    const createTag = async () => {
        if (!newTagName.trim() || !communityId)
            return;
        try {
            const { data, error } = await supabase.functions.invoke('manage-user-tags', {
                body: {
                    community_id: communityId,
                    action: 'create',
                    tag_data: {
                        name: newTagName.trim(),
                        color: newTagColor
                    }
                }
            });
            if (error)
                throw error;
            setTags(prev => [...prev, { ...data, user_count: 0 }]);
            setNewTagName('');
            setNewTagColor('#3B82F6');
        }
        catch (error) {
            console.error('Error creating tag:', error);
            alert('Error creating tag');
        }
    };
    const deleteTag = async () => {
        if (!tagToDelete || deleteConfirmation !== tagToDelete.name)
            return;
        try {
            const { error } = await supabase.functions.invoke('manage-user-tags', {
                body: {
                    community_id: communityId,
                    action: 'delete',
                    tag_data: { id: tagToDelete.id }
                }
            });
            if (error)
                throw error;
            setTags(prev => prev.filter(t => t.id !== tagToDelete.id));
            setTagToDelete(null);
            setDeleteConfirmation('');
            loadUsers(); // Refresh users to update tag assignments
        }
        catch (error) {
            console.error('Error deleting tag:', error);
            alert('Error deleting tag');
        }
    };
    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.first_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearchQuery.toLowerCase()));
        const matchesTag = selectedTagFilter === 'all' ||
            user.tags.some(tag => tag.id === selectedTagFilter);
        return matchesSearch && matchesTag;
    });
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const renderTabContent = () => {
        switch (activeTab) {
            case 'settings':
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Community Name *" }), _jsx("input", { type: "text", value: settingsForm.name, onChange: (e) => handleSettingsChange('name', e.target.value), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Enter community name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Project Name" }), _jsx("input", { type: "text", value: settingsForm.project_name, onChange: (e) => handleSettingsChange('project_name', e.target.value), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Optional project name" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Brand Color" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 rounded-md border border-gray-300 cursor-pointer", style: { backgroundColor: settingsForm.brand_color }, onClick: () => {
                                                const input = document.createElement('input');
                                                input.type = 'color';
                                                input.value = settingsForm.brand_color;
                                                input.onchange = (e) => {
                                                    handleSettingsChange('brand_color', e.target.value);
                                                };
                                                input.click();
                                            } }), _jsx("input", { type: "text", value: settingsForm.brand_color, onChange: (e) => handleSettingsChange('brand_color', e.target.value), className: "flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono", placeholder: "#3B82F6" })] })] }), _jsx("div", { children: _jsxs("label", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "checkbox", checked: settingsForm.forum_enabled, onChange: (e) => handleSettingsChange('forum_enabled', e.target.checked), className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Enable Forum" }), _jsx("p", { className: "text-xs text-gray-500", children: "Allow users to participate in community discussions" })] })] }) }), _jsx("div", { className: "flex justify-end pt-4 border-t", children: _jsxs("button", { onClick: saveSettings, disabled: !settingsChanged || saving, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", children: [saving && (_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })), _jsx(Save, { size: 16 }), _jsx("span", { children: "Save Changes" })] }) })] }));
            case 'features':
                return (_jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-gray-600 text-sm mb-6", children: "Control which platform features are available to this community's users." }), PLATFORM_FEATURES.map((platformFeature, index) => {
                            const feature = features.find(f => f.feature_name === platformFeature.key);
                            const enabled = feature?.enabled ?? true;
                            return (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: platformFeature.label }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: platformFeature.description })] }), _jsxs("button", { onClick: () => toggleFeature(index), className: `flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${enabled
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [enabled ? _jsx(ToggleRight, { size: 20 }) : _jsx(ToggleLeft, { size: 20 }), _jsx("span", { className: "text-sm font-medium", children: enabled ? 'Enabled' : 'Disabled' })] })] }, platformFeature.key));
                        })] }));
            case 'tags':
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900 mb-3", children: "Create New Tag" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "text", value: newTagName, onChange: (e) => setNewTagName(e.target.value), className: "flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Tag name" }), _jsx("div", { className: "w-10 h-10 rounded-md border border-gray-300 cursor-pointer", style: { backgroundColor: newTagColor }, onClick: () => {
                                                const input = document.createElement('input');
                                                input.type = 'color';
                                                input.value = newTagColor;
                                                input.onchange = (e) => {
                                                    setNewTagColor(e.target.value);
                                                };
                                                input.click();
                                            } }), _jsxs("button", { onClick: createTag, disabled: !newTagName.trim(), className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", children: [_jsx(Plus, { size: 16 }), _jsx("span", { children: "Create Tag" })] })] })] }), _jsx("div", { className: "space-y-3", children: tags.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(Tag, { size: 48, className: "mx-auto mb-4 text-gray-300" }), _jsx("p", { children: "No tags created yet" }), _jsx("p", { className: "text-sm", children: "Create your first tag above" })] })) : (tags.map(tag => (_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "inline-block px-3 py-1 rounded-full text-white text-sm font-medium", style: { backgroundColor: tag.color }, children: tag.name }), _jsxs("span", { className: "text-sm text-gray-500", children: ["(", tag.user_count, " users)"] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => setEditingTag(tag), className: "text-gray-400 hover:text-blue-600 transition-colors", children: _jsx(Edit2, { size: 16 }) }), _jsx("button", { onClick: () => setTagToDelete(tag), className: "text-gray-400 hover:text-red-600 transition-colors", children: _jsx(Trash2, { size: 16 }) })] })] }, tag.id)))) }), tagToDelete && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl p-6 w-full max-w-md", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(AlertTriangle, { className: "text-red-500 mr-3", size: 24 }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Delete Tag" })] }), _jsxs("p", { className: "text-gray-600 mb-4", children: ["This will permanently delete the tag \"", tagToDelete.name, "\" and remove it from all ", tagToDelete.user_count, " assigned users."] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Type the tag name to confirm:" }), _jsx("input", { type: "text", value: deleteConfirmation, onChange: (e) => setDeleteConfirmation(e.target.value), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500", placeholder: tagToDelete.name })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { onClick: () => {
                                                    setTagToDelete(null);
                                                    setDeleteConfirmation('');
                                                }, className: "px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50", children: "Cancel" }), _jsx("button", { onClick: deleteTag, disabled: deleteConfirmation !== tagToDelete.name, className: "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed", children: "Delete Tag" })] })] }) }))] }));
            case 'users':
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { size: 20, className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: userSearchQuery, onChange: (e) => setUserSearchQuery(e.target.value), className: "pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Search users..." })] }), _jsxs("select", { value: selectedTagFilter, onChange: (e) => setSelectedTagFilter(e.target.value), className: "border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Tags" }), tags.map(tag => (_jsx("option", { value: tag.id, children: tag.name }, tag.id)))] })] }), _jsxs("button", { onClick: () => setCsvUploadOpen(true), className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2", children: [_jsx(Upload, { size: 20 }), _jsx("span", { children: "Upload CSV" })] })] }), _jsx("div", { className: "bg-white border border-gray-200 rounded-lg overflow-hidden", children: filteredUsers.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Users, { size: 48, className: "mx-auto mb-4 text-gray-300" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No users found" }), _jsx("p", { className: "text-gray-600 mb-4", children: userSearchQuery || selectedTagFilter !== 'all'
                                            ? 'Try adjusting your search criteria.'
                                            : 'Start by uploading users via CSV or create them manually.' }), !userSearchQuery && selectedTagFilter === 'all' && (_jsx("button", { onClick: () => setCsvUploadOpen(true), className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700", children: "Upload First Users" }))] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "User" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Tags" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Last Active" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Created" }), _jsx("th", { className: "px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredUsers.map(user => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { children: [_jsxs("div", { className: "text-sm font-medium text-gray-900", children: [user.first_name, " ", user.last_name] }), _jsx("div", { className: "text-sm text-gray-500", children: user.email })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex flex-wrap gap-1", children: [user.tags.map(tag => (_jsx("span", { className: "inline-block px-2 py-1 text-xs text-white rounded-full", style: { backgroundColor: tag.color }, children: tag.name }, tag.id))), user.tags.length === 0 && (_jsx("span", { className: "text-sm text-gray-400", children: "No tags" }))] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: user.last_active ? formatDate(user.last_active) : 'Never' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatDate(user.created_at) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-center", children: _jsx("button", { onClick: () => navigate(`/users/${user.id}`), className: "text-blue-600 hover:text-blue-800 transition-colors", title: "View Details", children: _jsx(Eye, { size: 16 }) }) })] }, user.id))) })] }) })) })] }));
            default:
                return null;
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: _jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    if (!community) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Community not found" }), _jsx("button", { onClick: () => navigate('/communities'), className: "mt-4 text-blue-600 hover:text-blue-800", children: "Back to Communities" })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "flex items-center justify-between py-6", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: () => navigate('/communities'), className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(ArrowLeft, { size: 24 }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [community.logo_url ? (_jsx("img", { src: community.logo_url, alt: community.name, className: "w-12 h-12 rounded-full object-cover border border-gray-200" })) : (_jsx("div", { className: "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold", style: { backgroundColor: community.brand_color }, children: community.name.charAt(0).toUpperCase() })), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: community.name }), community.project_name && (_jsx("p", { className: "text-gray-600", children: community.project_name }))] })] })] }) }) }) }), _jsx("div", { className: "bg-white border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("nav", { className: "flex space-x-8", children: [
                            { id: 'settings', label: 'Settings', icon: Settings },
                            { id: 'features', label: 'Enabled Features', icon: ToggleLeft },
                            { id: 'tags', label: 'Tag Management', icon: Tag },
                            { id: 'users', label: 'User Management', icon: Users }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx(Icon, { size: 18 }), _jsx("span", { children: tab.label })] }, tab.id));
                        }) }) }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: renderTabContent() }) }), _jsx(CSVUploadModal, { isOpen: csvUploadOpen, onClose: () => setCsvUploadOpen(false), communityId: communityId, onUploadComplete: () => {
                    loadUsers();
                    loadTags(); // Refresh tags as new ones might have been created
                } })] }));
};
export default CommunityConfig;
