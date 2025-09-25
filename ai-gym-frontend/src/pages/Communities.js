import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Archive, MoreHorizontal, Users, Calendar, CheckCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CommunityModal from '../components/modals/CommunityModal';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
const Communities = () => {
    const navigate = useNavigate();
    const [communities, setCommunities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showArchived, setShowArchived] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCommunity, setEditingCommunity] = useState(null);
    const [actionDropdown, setActionDropdown] = useState(null);
    useEffect(() => {
        loadCommunities();
    }, [statusFilter, showArchived]);
    const loadCommunities = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('communities')
                .select('*')
                .order('created_at', { ascending: false });
            // Apply status filtering
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }
            // Handle archived filter
            if (!showArchived) {
                query = query.neq('status', 'archived');
            }
            const { data, error } = await query;
            if (error)
                throw error;
            setCommunities(data || []);
        }
        catch (error) {
            console.error('Error loading communities:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCreateCommunity = () => {
        setEditingCommunity(null);
        setIsModalOpen(true);
    };
    const handleEditCommunity = (community) => {
        setEditingCommunity(community);
        setIsModalOpen(true);
    };
    const handleManageCommunity = (communityId) => {
        navigate(`/communities/${communityId}`);
    };
    const handleArchiveCommunity = async (community) => {
        const newStatus = community.status === 'archived' ? 'active' : 'archived';
        try {
            const { error } = await supabase
                .from('communities')
                .update({ status: newStatus })
                .eq('id', community.id);
            if (error)
                throw error;
            loadCommunities(); // Refresh the list
        }
        catch (error) {
            console.error('Error updating community status:', error);
        }
    };
    const handleDeleteCommunity = async (community) => {
        if (!confirm(`Are you sure you want to permanently delete "${community.name}"? This action cannot be undone.`)) {
            return;
        }
        try {
            const { error } = await supabase
                .from('communities')
                .delete()
                .eq('id', community.id);
            if (error)
                throw error;
            loadCommunities(); // Refresh the list
        }
        catch (error) {
            console.error('Error deleting community:', error);
        }
    };
    const handlePreviewCommunity = (community) => {
        // Open community's preview in a new tab
        window.open(`/community-preview/${community.id}`, '_blank');
    };
    const filteredCommunities = communities.filter(community => {
        const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (community.project_name && community.project_name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            archived: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Archive },
            inactive: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: null }
        };
        const config = statusConfig[status] || statusConfig.active;
        const Icon = config.icon;
        return (_jsxs("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`, children: [Icon && _jsx(Icon, { size: 12, className: "mr-1" }), status.charAt(0).toUpperCase() + status.slice(1)] }));
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Community Management" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Manage your communities and their platform configurations" })] }), _jsxs("button", { onClick: handleCreateCommunity, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors", children: [_jsx(Plus, { size: 20 }), _jsx("span", { children: "Create New Community" })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { size: 20, className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search communities or projects...", className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex items-center space-x-6", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Filter, { size: 16, className: "text-gray-400" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" }), _jsx("option", { value: "archived", children: "Archived" })] })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: showArchived, onChange: (e) => setShowArchived(e.target.checked), className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700", children: "Show Archived" })] })] })] }), _jsx("div", { className: "mt-4 pt-4 border-t border-gray-200", children: _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: communities.filter(c => c.status === 'active').length }), _jsx("div", { className: "text-sm text-gray-600", children: "Active Communities" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-600", children: communities.length }), _jsx("div", { className: "text-sm text-gray-600", children: "Total Communities" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: communities.filter(c => c.forum_enabled).length }), _jsx("div", { className: "text-sm text-gray-600", children: "Forum Enabled" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: communities.filter(c => c.is_template).length }), _jsx("div", { className: "text-sm text-gray-600", children: "Templates" })] })] }) })] }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: isLoading ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Loading communities..." })] })) : filteredCommunities.length === 0 ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx(Users, { size: 48, className: "mx-auto text-gray-300 mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No communities found" }), _jsx("p", { className: "text-gray-600 mb-4", children: searchQuery ? 'Try adjusting your search criteria.' : 'Get started by creating your first community.' }), !searchQuery && (_jsx("button", { onClick: handleCreateCommunity, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: "Create First Community" }))] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Community" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Project" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Active Users" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Created" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredCommunities.map((community) => (_jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [community.logo_url ? (_jsx("img", { src: community.logo_url, alt: `${community.name} logo`, className: "w-10 h-10 rounded-full object-cover border border-gray-200" })) : (_jsx("div", { className: "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-sm", style: { backgroundColor: community.brand_color || '#3B82F6' }, children: community.name.charAt(0).toUpperCase() })), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: community.name }), community.is_template && (_jsx("span", { className: "inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full mt-1", children: "Template" }))] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-900", children: community.project_name || _jsx("span", { className: "text-gray-400", children: "-" }) }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { size: 16, className: "text-gray-400 mr-1" }), _jsx("span", { className: "text-sm text-gray-900", children: "-" })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { size: 16, className: "text-gray-400 mr-1" }), _jsx("span", { className: "text-sm text-gray-900", children: formatDate(community.created_at) })] }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [getStatusBadge(community.status), community.forum_enabled && (_jsx("span", { className: "ml-2 inline-block w-2 h-2 bg-green-400 rounded-full", title: "Forum Enabled" }))] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-center", children: _jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx("button", { onClick: () => handleManageCommunity(community.id), className: "bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors", children: "Manage" }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setActionDropdown(actionDropdown === community.id ? null : community.id), className: "text-gray-400 hover:text-gray-600 p-1 rounded transition-colors", children: _jsx(MoreHorizontal, { size: 16 }) }), actionDropdown === community.id && (_jsx("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10", children: _jsxs("div", { className: "py-1", children: [_jsxs("button", { onClick: () => {
                                                                                    handlePreviewCommunity(community);
                                                                                    setActionDropdown(null);
                                                                                }, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: [_jsx(Eye, { size: 16, className: "mr-2" }), "Preview"] }), _jsxs("button", { onClick: () => {
                                                                                    handleEditCommunity(community);
                                                                                    setActionDropdown(null);
                                                                                }, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: [_jsx(Edit, { size: 16, className: "mr-2" }), "Edit"] }), _jsxs("button", { onClick: () => {
                                                                                    handleArchiveCommunity(community);
                                                                                    setActionDropdown(null);
                                                                                }, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: [_jsx(Archive, { size: 16, className: "mr-2" }), community.status === 'archived' ? 'Restore' : 'Archive'] }), community.status === 'archived' && (_jsxs("button", { onClick: () => {
                                                                                    handleDeleteCommunity(community);
                                                                                    setActionDropdown(null);
                                                                                }, className: "flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50", children: [_jsx(Trash2, { size: 16, className: "mr-2" }), "Delete Permanently"] }))] }) }))] })] }) })] }, community.id))) })] }) })) }), _jsx(CommunityModal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), onCommunityCreated: loadCommunities, editingCommunity: editingCommunity })] }) }));
};
export { Communities };
