import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Users, Search, Building2, MoreHorizontal } from 'lucide-react';
function UsersPage() {
    const [users, setUsers] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [userTags, setUserTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCommunity, setSelectedCommunity] = useState('');
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch all data in parallel
            const [usersRes, communitiesRes, tagsRes] = await Promise.all([
                supabase.from('users').select('*').order('created_at', { ascending: false }),
                supabase.from('communities').select('*').order('name'),
                supabase.from('user_tags').select('*').order('name')
            ]);
            if (usersRes.data)
                setUsers(usersRes.data);
            if (communitiesRes.data)
                setCommunities(communitiesRes.data);
            if (tagsRes.data)
                setUserTags(tagsRes.data);
        }
        catch (error) {
            console.error('Error fetching data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCommunity = selectedCommunity === '' || user.community_id === selectedCommunity;
        return matchesSearch && matchesCommunity;
    });
    const getUserCommunity = (communityId) => {
        return communities.find(c => c.id === communityId);
    };
    const getFullName = (user) => {
        if (user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`;
        }
        return user.first_name || user.last_name || 'Unnamed User';
    };
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "flex justify-center items-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Users" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Manage users across all community organizations" })] }), _jsxs("button", { className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Add User"] })] }), _jsx("div", { className: "bg-white p-6 rounded-xl shadow-sm border border-gray-200", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }), _jsx("input", { type: "text", placeholder: "Search users by name or email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("select", { value: selectedCommunity, onChange: (e) => setSelectedCommunity(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "All Communities" }), communities.map((community) => (_jsx("option", { value: community.id, children: community.name }, community.id)))] })] }) }), _jsxs("div", { className: "bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "All Users" }), _jsxs("span", { className: "text-sm text-gray-500", children: [filteredUsers.length, " users"] })] }) }), _jsx("div", { className: "divide-y divide-gray-200", children: filteredUsers.map((user) => {
                                const community = getUserCommunity(user.community_id);
                                return (_jsx("div", { className: "px-6 py-4 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white text-sm font-medium", children: getFullName(user).charAt(0).toUpperCase() }) }), _jsxs("div", { children: [_jsx("div", { className: "flex items-center space-x-2", children: _jsx("h3", { className: "text-base font-medium text-gray-900", children: getFullName(user) }) }), _jsxs("div", { className: "flex items-center space-x-4 mt-1", children: [_jsx("p", { className: "text-sm text-gray-600", children: user.email }), community && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Building2, { className: "h-3 w-3", style: { color: community.brand_color } }), _jsx("span", { className: "text-xs text-gray-500", children: community.name })] }))] })] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "text-right text-sm", children: [_jsx("p", { className: "text-gray-900", children: "Created" }), _jsx("p", { className: "text-gray-500", children: new Date(user.created_at).toLocaleDateString() })] }), user.last_active && (_jsxs("div", { className: "text-right text-sm", children: [_jsx("p", { className: "text-gray-900", children: "Last Active" }), _jsx("p", { className: "text-gray-500", children: new Date(user.last_active).toLocaleDateString() })] })), _jsx("button", { className: "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) })] })] }) }, user.id));
                            }) }), filteredUsers.length === 0 && (_jsxs("div", { className: "px-6 py-8 text-center", children: [_jsx(Users, { className: "mx-auto h-12 w-12 text-gray-300" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: searchTerm || selectedCommunity ? 'No users found' : 'No users yet' }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: searchTerm || selectedCommunity
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'Users will appear here once they are created for communities.' })] }))] })] }) }));
}
export default UsersPage;
