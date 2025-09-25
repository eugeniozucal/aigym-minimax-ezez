import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { Users, TrendingUp, Activity, MessageSquare, BookOpen, RefreshCw, BarChart3, PieChart, Clock, AlertCircle, Trophy, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
// Skeleton Components
const SkeletonCard = () => (_jsx("div", { className: "bg-white rounded-xl p-6 border border-gray-200 animate-pulse", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-12 h-12 bg-gray-200 rounded-lg" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-24 mb-2" }), _jsx("div", { className: "h-6 bg-gray-200 rounded w-16" })] })] }) }));
const SkeletonWidget = ({ height = "h-80" }) => (_jsxs("div", { className: `bg-white rounded-xl border border-gray-200 ${height} animate-pulse`, children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsx("div", { className: "h-6 bg-gray-200 rounded w-32" }) }), _jsx("div", { className: "p-6 space-y-4", children: [...Array(5)].map((_, i) => (_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-8 h-4 bg-gray-200 rounded" }), _jsx("div", { className: "flex-1 h-4 bg-gray-200 rounded" }), _jsx("div", { className: "w-12 h-4 bg-gray-200 rounded" })] }, i))) })] }));
// Empty State Component
const EmptyState = ({ title, description, icon: Icon }) => (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [_jsx(Icon, { className: "w-12 h-12 text-gray-300 mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: title }), _jsx("p", { className: "text-gray-500 max-w-md", children: description })] }));
export function Dashboard() {
    const [analyticsData, setAnalyticsData] = useState({});
    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState('all');
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const mountedRef = useRef(true);
    const lastFetchRef = useRef('');
    // Stable community fetch function
    const fetchCommunities = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('communities')
                .select('id, name, brand_color')
                .order('name');
            if (error)
                throw error;
            if (mountedRef.current && data) {
                setCommunities(data);
            }
        }
        catch (err) {
            console.error('Error fetching communities:', err);
        }
    }, []);
    // Stable analytics fetch function
    const fetchAnalyticsData = useCallback(async (isRefresh = false) => {
        if (!mountedRef.current)
            return;
        const fetchKey = `${selectedCommunity}-${dateRange.start}-${dateRange.end}`;
        // Prevent duplicate requests
        if (lastFetchRef.current === fetchKey && !isRefresh) {
            return;
        }
        try {
            if (isRefresh) {
                setRefreshing(true);
            }
            else {
                setLoading(true);
            }
            setError(null);
            lastFetchRef.current = fetchKey;
            const { data, error: functionError } = await supabase.functions.invoke('analytics-dashboard', {
                body: {
                    communityId: selectedCommunity,
                    dateRange: {
                        start: format(startOfDay(new Date(dateRange.start)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
                        end: format(endOfDay(new Date(dateRange.end)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
                    },
                    metrics: ['user_activity', 'recent_activity', 'content_engagement', 'agent_usage', 'summary_stats']
                }
            });
            if (functionError) {
                throw new Error(functionError.message || 'Failed to fetch analytics data');
            }
            if (mountedRef.current) {
                setAnalyticsData(data || {});
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
            if (mountedRef.current) {
                setError(errorMessage);
                console.error('Analytics fetch error:', err);
            }
        }
        finally {
            if (mountedRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [selectedCommunity, dateRange.start, dateRange.end]);
    // Fetch communities once on mount
    useEffect(() => {
        fetchCommunities();
    }, [fetchCommunities]);
    // Fetch analytics data when dependencies change
    useEffect(() => {
        fetchAnalyticsData();
    }, [fetchAnalyticsData]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);
    const handleRefresh = useCallback(() => {
        fetchAnalyticsData(true);
    }, [fetchAnalyticsData]);
    const handleCommunityChange = useCallback((communityId) => {
        setSelectedCommunity(communityId);
    }, []);
    const handleDateRangeChange = useCallback((field, value) => {
        setDateRange(prev => ({ ...prev, [field]: value }));
    }, []);
    // Summary stats cards
    const summaryCards = [
        {
            title: 'Total Users',
            value: analyticsData.summaryStats?.totalUsers || 0,
            icon: Users,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            title: 'Content Items',
            value: analyticsData.summaryStats?.totalContent || 0,
            icon: BookOpen,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
        {
            title: 'Recent Activities',
            value: analyticsData.summaryStats?.recentActivities || 0,
            icon: Activity,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600'
        },
        {
            title: 'Active Sessions',
            value: analyticsData.agentUsage?.reduce((sum, agent) => sum + agent.conversation_count, 0) || 0,
            icon: MessageSquare,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600'
        }
    ];
    // Prepare chart data
    const contentEngagementChartData = analyticsData.contentEngagement?.slice(0, 8).map(item => ({
        name: item.content_items.title.substring(0, 20) + '...',
        engagements: item.engagement_count,
        type: item.content_items.content_type
    })) || [];
    const agentUsageChartData = analyticsData.agentUsage?.slice(0, 6).map((agent, index) => ({
        name: agent.content_items.title.substring(0, 15) + '...',
        conversations: agent.conversation_count,
        messages: agent.total_messages,
        fill: CHART_COLORS[index % CHART_COLORS.length]
    })) || [];
    if (loading && !refreshing) {
        return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-8", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("div", { className: "h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" }), _jsx("div", { className: "h-5 bg-gray-200 rounded w-80 animate-pulse" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [...Array(4)].map((_, i) => _jsx(SkeletonCard, {}, i)) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsx(SkeletonWidget, {}), _jsx(SkeletonWidget, {}), _jsx(SkeletonWidget, {}), _jsx(SkeletonWidget, {})] })] }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Analytics Dashboard" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Track platform performance and user engagement" })] }), _jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4", children: [_jsxs("div", { className: "relative", children: [_jsxs("select", { value: selectedCommunity, onChange: (e) => handleCommunityChange(e.target.value), className: "appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: "All Communities" }), communities.map(community => (_jsx("option", { value: community.id, children: community.name }, community.id)))] }), _jsx(ChevronDown, { className: "absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "date", value: dateRange.start, onChange: (e) => handleDateRangeChange('start', e.target.value), className: "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" }), _jsx("span", { className: "text-gray-500", children: "to" }), _jsx("input", { type: "date", value: dateRange.end, onChange: (e) => handleDateRangeChange('end', e.target.value), className: "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("button", { onClick: handleRefresh, disabled: refreshing, className: "inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}` }), "Refresh"] })] })] }), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500" }), _jsx("span", { className: "text-red-700", children: error }), _jsx("button", { onClick: handleRefresh, className: "ml-auto text-red-600 hover:text-red-700 font-medium", children: "Try Again" })] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: summaryCards.map((stat) => {
                        const Icon = stat.icon;
                        return (_jsx("div", { className: `${stat.bgColor} rounded-xl p-6 border border-gray-200`, children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `${stat.color} rounded-lg p-3 mr-4`, children: _jsx(Icon, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: stat.title }), _jsx("p", { className: `text-3xl font-bold ${stat.textColor}`, children: stat.value.toLocaleString() })] })] }) }, stat.title));
                    }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "bg-white rounded-xl border border-gray-200", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Trophy, { className: "w-5 h-5 text-yellow-500" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Top Active Users" })] }), _jsx("span", { className: "text-sm text-gray-500", children: "Last 30 days" })] }), _jsx("div", { className: "p-6", children: analyticsData.userActivity && analyticsData.userActivity.length > 0 ? (_jsx("div", { className: "space-y-4", children: analyticsData.userActivity.slice(0, 10).map((user, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'}`, children: index + 1 }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium text-gray-900", children: [user.first_name, " ", user.last_name] }), _jsx("p", { className: "text-sm text-gray-500", children: user.email })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold text-gray-900", children: user.activity_count }), _jsx("p", { className: "text-xs text-gray-500", children: "activities" })] })] }, user.user_id))) })) : (_jsx(EmptyState, { title: "No user activity data", description: "User activity will appear here once users start engaging with the platform", icon: Users })) })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Clock, { className: "w-5 h-5 text-blue-500" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Recent Activity" })] }), _jsx("span", { className: "text-sm text-gray-500", children: "Live feed" })] }), _jsx("div", { className: "p-6 max-h-96 overflow-y-auto", children: analyticsData.recentActivity && analyticsData.recentActivity.length > 0 ? (_jsx("div", { className: "space-y-4", children: analyticsData.recentActivity.slice(0, 20).map((activity) => (_jsxs("div", { className: "flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors", children: [_jsx(Activity, { className: "w-4 h-4 text-green-500 mt-1 flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-sm text-gray-900", children: [_jsxs("span", { className: "font-medium", children: [activity.users.first_name, " ", activity.users.last_name] }), ' ', activity.activity_type.replace('_', ' '), activity.content_items && (_jsxs("span", { className: "text-gray-600", children: [' ', "\"", _jsx("span", { className: "font-medium", children: activity.content_items.title }), "\""] }))] }), _jsx("p", { className: "text-xs text-gray-500", children: format(new Date(activity.created_at), 'MMM d, h:mm a') })] })] }, activity.id))) })) : (_jsx(EmptyState, { title: "No recent activity", description: "User activities will appear here as they happen on your platform", icon: Activity })) })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(BarChart3, { className: "w-5 h-5 text-purple-500" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Content Engagement" })] }) }), _jsx("div", { className: "p-6", children: contentEngagementChartData.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: contentEngagementChartData, layout: "horizontal", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { dataKey: "name", type: "category", width: 120 }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "engagements", fill: "#8B5CF6", radius: [0, 4, 4, 0] })] }) })) : (_jsx(EmptyState, { title: "No engagement data", description: "Content engagement metrics will appear here once users start interacting with your content", icon: BarChart3 })) })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(PieChart, { className: "w-5 h-5 text-green-500" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Agent Usage" })] }) }), _jsx("div", { className: "p-6", children: agentUsageChartData.length > 0 ? (_jsxs("div", { className: "flex items-center space-x-8", children: [_jsx(ResponsiveContainer, { width: "70%", height: 300, children: _jsxs(RechartsPieChart, { children: [_jsx(Pie, { data: agentUsageChartData, cx: "50%", cy: "50%", outerRadius: 100, dataKey: "conversations", children: agentUsageChartData.map((entry, index) => (_jsx(Cell, { fill: entry.fill }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) }), _jsx("div", { className: "space-y-2", children: agentUsageChartData.map((item, index) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: item.fill } }), _jsx("span", { className: "text-sm text-gray-700", children: item.name })] }, index))) })] })) : (_jsx(EmptyState, { title: "No agent usage data", description: "Agent conversation statistics will appear here once users start chatting with AI agents", icon: MessageSquare })) })] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-blue-500" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Platform Overview" })] }), _jsxs("span", { className: "text-sm text-gray-500", children: [format(new Date(dateRange.start), 'MMM d'), " - ", format(new Date(dateRange.end), 'MMM d, yyyy')] })] }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-3xl font-bold text-blue-600 mb-2", children: [((analyticsData.summaryStats?.recentActivities || 0) / Math.max(analyticsData.summaryStats?.totalUsers || 1, 1) * 100).toFixed(1), "%"] }), _jsx("p", { className: "text-gray-600", children: "User Engagement Rate" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Activities per user in selected period" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-green-600 mb-2", children: analyticsData.contentEngagement?.length || 0 }), _jsx("p", { className: "text-gray-600", children: "Active Content Items" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Content with user interactions" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-purple-600 mb-2", children: (analyticsData.agentUsage?.reduce((sum, agent) => sum + agent.total_messages, 0) || 0) }), _jsx("p", { className: "text-gray-600", children: "Total Messages" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Messages exchanged with AI agents" })] })] }) })] })] }) }));
}
