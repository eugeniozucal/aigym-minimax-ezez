import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Eye, Search, Users, Plus, Calendar, Dumbbell, Package, BarChart3, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
export function Dashboard() {
    const [stats, setStats] = useState({
        totalWods: 0,
        publishedWods: 0,
        draftWods: 0,
        totalBlocks: 0,
        totalPrograms: 0,
        activeUsers: 0
    });
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchDashboardData();
    }, []);
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch WODs data
            const { data: wodsData, error: wodsError } = await supabase
                .from('wods')
                .select('id, title, description, status, created_at, updated_at')
                .order('updated_at', { ascending: false })
                .limit(3);
            if (wodsError) {
                console.error('Error fetching WODs:', wodsError);
            }
            // Calculate WOD stats
            const { count: totalWodsCount } = await supabase
                .from('wods')
                .select('*', { count: 'exact', head: true });
            const { count: publishedWodsCount } = await supabase
                .from('wods')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'published');
            const { count: draftWodsCount } = await supabase
                .from('wods')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'draft');
            // Get active users count (users who have activities in the last 30 days)
            const { count: activeUsersCount } = await supabase
                .from('user_activities')
                .select('user_id', { count: 'exact', head: true })
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            // TODO: Add blocks and programs data when those tables exist
            const recentWods = (wodsData || []).map(wod => ({
                ...wod,
                type: 'wod'
            }));
            setStats({
                totalWods: totalWodsCount || 0,
                publishedWods: publishedWodsCount || 0,
                draftWods: draftWodsCount || 0,
                totalBlocks: 0, // TODO: Implement when blocks table exists
                totalPrograms: 0, // TODO: Implement when programs table exists
                activeUsers: activeUsersCount || 0
            });
            setRecentItems(recentWods);
        }
        catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-yellow-100 text-yellow-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'wod': return Dumbbell;
            case 'block': return Package;
            case 'program': return Calendar;
            default: return Target;
        }
    };
    const getTypeColor = (type) => {
        switch (type) {
            case 'wod': return 'text-orange-600';
            case 'block': return 'text-blue-600';
            case 'program': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading Dashboard..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-red-500 mb-4", children: _jsx(BarChart3, { className: "h-12 w-12 mx-auto" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Error Loading Dashboard" }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: error }), _jsx("button", { onClick: fetchDashboardData, className: "px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700", children: "Try Again" })] }) }));
    }
    return (_jsx("div", { className: "h-full overflow-y-auto", children: _jsxs("div", { className: "p-8 space-y-8", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Training Zone Dashboard" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Monitor and manage your training content across all modules" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs(Link, { to: "/page-builder", className: "inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create Page"] }), _jsxs(Link, { to: "/program-builder", className: "inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all", children: [_jsx(Calendar, { className: "-ml-1 mr-2 h-4 w-4" }), "Create Program"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6", children: [_jsx("div", { className: "bg-white rounded-xl p-6 border border-gray-200 shadow-sm", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "bg-orange-500 rounded-lg p-3 mr-4", children: _jsx(Target, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total WODs" }), _jsx("p", { className: "text-2xl font-bold text-orange-600", children: stats.totalWods.toLocaleString() })] })] }) }), _jsx("div", { className: "bg-white rounded-xl p-6 border border-gray-200 shadow-sm", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "bg-green-500 rounded-lg p-3 mr-4", children: _jsx(Eye, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Published" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: stats.publishedWods.toLocaleString() })] })] }) }), _jsx("div", { className: "bg-white rounded-xl p-6 border border-gray-200 shadow-sm", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "bg-yellow-500 rounded-lg p-3 mr-4", children: _jsx(Search, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Drafts" }), _jsx("p", { className: "text-2xl font-bold text-yellow-600", children: stats.draftWods.toLocaleString() })] })] }) }), _jsx("div", { className: "bg-white rounded-xl p-6 border border-gray-200 shadow-sm", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "bg-blue-500 rounded-lg p-3 mr-4", children: _jsx(Package, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "BLOCKS" }), _jsx("p", { className: "text-2xl font-bold text-blue-600", children: stats.totalBlocks.toLocaleString() })] })] }) }), _jsx("div", { className: "bg-white rounded-xl p-6 border border-gray-200 shadow-sm", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "bg-purple-500 rounded-lg p-3 mr-4", children: _jsx(Calendar, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Programs" }), _jsx("p", { className: "text-2xl font-bold text-purple-600", children: stats.totalPrograms.toLocaleString() })] })] }) }), _jsx("div", { className: "bg-white rounded-xl p-6 border border-gray-200 shadow-sm", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "bg-indigo-500 rounded-lg p-3 mr-4", children: _jsx(Users, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Users" }), _jsx("p", { className: "text-2xl font-bold text-indigo-600", children: stats.activeUsers.toLocaleString() })] })] }) })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6 shadow-sm", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4", children: [_jsxs(Link, { to: "/training-zone/wods", className: "flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group", children: [_jsx("div", { className: "bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors", children: _jsx(Dumbbell, { className: "h-5 w-5 text-orange-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Browse WODs" }), _jsx("p", { className: "text-sm text-gray-500", children: "View all workouts" })] })] }), _jsxs(Link, { to: "/page-builder?repo=wods", className: "flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group", children: [_jsx("div", { className: "bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors", children: _jsx(Plus, { className: "h-5 w-5 text-green-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Create WOD" }), _jsx("p", { className: "text-sm text-gray-500", children: "Design new workout" })] })] }), _jsxs(Link, { to: "/training-zone/blocks", className: "flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group", children: [_jsx("div", { className: "bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors", children: _jsx(Package, { className: "h-5 w-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Browse BLOCKS" }), _jsx("p", { className: "text-sm text-gray-500", children: "Modular components" })] })] }), _jsxs(Link, { to: "/page-builder?repo=blocks", className: "flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group", children: [_jsx("div", { className: "bg-cyan-100 p-3 rounded-lg group-hover:bg-cyan-200 transition-colors", children: _jsx(Plus, { className: "h-5 w-5 text-cyan-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Create BLOCK" }), _jsx("p", { className: "text-sm text-gray-500", children: "Build new component" })] })] }), _jsxs(Link, { to: "/training-zone/programs", className: "flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group", children: [_jsx("div", { className: "bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors", children: _jsx(Calendar, { className: "h-5 w-5 text-purple-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Browse Programs" }), _jsx("p", { className: "text-sm text-gray-500", children: "Training programs" })] })] }), _jsxs(Link, { to: "/program-builder", className: "flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group", children: [_jsx("div", { className: "bg-violet-100 p-3 rounded-lg group-hover:bg-violet-200 transition-colors", children: _jsx(Plus, { className: "h-5 w-5 text-violet-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Create Program" }), _jsx("p", { className: "text-sm text-gray-500", children: "Build training program" })] })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200 flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Recent Activity" }), _jsx(Link, { to: "/training-zone/wods", className: "text-sm font-medium text-orange-600 hover:text-orange-700", children: "View All" })] }), _jsx("div", { className: "p-6", children: recentItems.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "bg-orange-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4", children: _jsx(TrendingUp, { className: "h-12 w-12 text-orange-600" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "No recent activity" }), _jsx("p", { className: "text-sm text-gray-500 mt-2 max-w-sm mx-auto", children: "Start creating content to see recent activity here." }), _jsx("div", { className: "mt-6", children: _jsxs(Link, { to: "/page-builder", className: "inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm", children: [_jsx(Plus, { className: "-ml-1 mr-2 h-4 w-4" }), "Create Content"] }) })] })) : (_jsx("div", { className: "space-y-4", children: recentItems.map((item) => {
                                    const Icon = getTypeIcon(item.type);
                                    return (_jsxs("div", { className: "flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx("div", { className: `p-2 rounded-lg bg-gray-100`, children: _jsx(Icon, { className: `h-5 w-5 ${getTypeColor(item.type)}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-gray-900 truncate", children: item.title }), _jsx("p", { className: "text-sm text-gray-500 truncate", children: item.description || 'No description provided' }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`, children: item.status }), _jsxs("span", { className: "text-xs text-gray-500", children: ["Updated ", new Date(item.updated_at).toLocaleDateString()] })] })] })] }, item.id));
                                }) })) })] })] }) }));
}
export default Dashboard;
