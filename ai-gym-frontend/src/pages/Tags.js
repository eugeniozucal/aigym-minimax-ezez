import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Tag, Building2, Edit2, Trash2 } from 'lucide-react';
import { TagModal } from '@/components/modals/TagModal';
function Tags() {
    const [tags, setTags] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [selectedCommunity, setSelectedCommunity] = useState('');
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            const [tagsRes, communitiesRes] = await Promise.all([
                supabase.from('user_tags').select('*').order('created_at', { ascending: false }),
                supabase.from('communities').select('*').order('name')
            ]);
            if (tagsRes.data)
                setTags(tagsRes.data);
            if (communitiesRes.data)
                setCommunities(communitiesRes.data);
        }
        catch (error) {
            console.error('Error fetching data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateTag = () => {
        setEditingTag(null);
        setIsModalOpen(true);
    };
    const handleEditTag = (tag) => {
        setEditingTag(tag);
        setIsModalOpen(true);
    };
    const handleDeleteTag = async (tag) => {
        if (!confirm(`Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`)) {
            return;
        }
        try {
            const { error } = await supabase
                .from('user_tags')
                .delete()
                .eq('id', tag.id);
            if (error)
                throw error;
            setTags(tags.filter(t => t.id !== tag.id));
        }
        catch (error) {
            console.error('Error deleting tag:', error);
            alert('Failed to delete tag. Please try again.');
        }
    };
    const handleModalSuccess = () => {
        setIsModalOpen(false);
        fetchData();
    };
    const filteredTags = selectedCommunity
        ? tags.filter(tag => tag.community_id === selectedCommunity)
        : tags;
    const getCommunityName = (communityId) => {
        return communities.find(c => c.id === communityId)?.name || 'Unknown Community';
    };
    const groupedTags = filteredTags.reduce((groups, tag) => {
        const communityName = getCommunityName(tag.community_id);
        if (!groups[communityName]) {
            groups[communityName] = [];
        }
        groups[communityName].push(tag);
        return groups;
    }, {});
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "flex justify-center items-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }) }));
    }
    return (_jsxs(Layout, { children: [_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "User Tags" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Manage user categorization tags for each community" })] }), _jsxs("button", { onClick: handleCreateTag, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create Tag"] })] }), _jsx("div", { className: "bg-white p-6 rounded-xl shadow-sm border border-gray-200", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("label", { htmlFor: "community-filter", className: "text-sm font-medium text-gray-700", children: "Filter by Community:" }), _jsxs("select", { id: "community-filter", value: selectedCommunity, onChange: (e) => setSelectedCommunity(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "All Communities" }), communities.map((community) => (_jsx("option", { value: community.id, children: community.name }, community.id)))] })] }) }), Object.keys(groupedTags).length > 0 ? (_jsx("div", { className: "space-y-8", children: Object.entries(groupedTags).map(([communityName, communityTags]) => {
                            const community = communities.find(c => c.name === communityName);
                            return (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center space-x-3", children: [community && (_jsx("div", { className: "h-6 w-6 rounded flex items-center justify-center", style: { backgroundColor: community.brand_color + '20' }, children: _jsx(Building2, { className: "h-4 w-4", style: { color: community.brand_color } }) })), _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: communityName }), _jsxs("span", { className: "text-sm text-gray-500", children: ["(", communityTags.length, " tags)"] })] }) }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: communityTags.map((tag) => (_jsx("div", { className: "bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "h-8 w-8 rounded-full flex items-center justify-center", style: { backgroundColor: tag.color }, children: _jsx(Tag, { className: "h-4 w-4 text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: tag.name }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Created ", new Date(tag.created_at).toLocaleDateString()] })] })] }), _jsxs("div", { className: "flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx("button", { onClick: () => handleEditTag(tag), className: "p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors", children: _jsx(Edit2, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => handleDeleteTag(tag), className: "p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors", children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }) }, tag.id))) }) })] }, communityName));
                        }) })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx(Tag, { className: "mx-auto h-12 w-12 text-gray-300" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: selectedCommunity ? 'No tags found for this community' : 'No tags yet' }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: selectedCommunity
                                    ? 'This community has no user tags created yet.'
                                    : 'Get started by creating your first user tag.' }), _jsx("div", { className: "mt-6", children: _jsxs("button", { onClick: handleCreateTag, className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-5 w-5" }), "Create Tag"] }) })] }))] }), _jsx(TagModal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), onSuccess: handleModalSuccess, tag: editingTag, communities: communities })] }));
}
export default Tags;
