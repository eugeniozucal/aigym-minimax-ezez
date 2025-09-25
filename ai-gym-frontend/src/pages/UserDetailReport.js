import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Tag, Activity, BookOpen, MessageSquare, TrendingUp, CheckCircle, PlayCircle, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const UserDetailReport = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    // Tab-specific data
    const [activityData, setActivityData] = useState([]);
    const [contentMastery, setContentMastery] = useState([]);
    const [courseProgress, setCourseProgress] = useState([]);
    const [overviewStats, setOverviewStats] = useState({
        totalActivities: 0,
        contentCompleted: 0,
        avgScore: 0,
        streakDays: 0,
        totalTimeSpent: 0
    });
    const loadUserDetails = useCallback(async () => {
        if (!userId)
            return;
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
          *,
          clients!inner(
            id,
            name,
            logo_url,
            brand_color
          ),
          user_tag_assignments(
            user_tags(
              id,
              name,
              color
            )
          )
        `)
                .eq('id', userId)
                .single();
            if (error)
                throw error;
            if (!data)
                throw new Error('User not found');
            const userDetails = {
                ...data,
                client: data.clients,
                tags: data.user_tag_assignments?.map((assignment) => assignment.user_tags) || []
            };
            setUser(userDetails);
            await loadOverviewData(userId, userDetails.client.id);
        }
        catch (error) {
            console.error('Error loading user:', error);
            navigate('/communities');
        }
        finally {
            setLoading(false);
        }
    }, [userId, navigate]);
    const loadOverviewData = async (userId, clientId) => {
        try {
            // Load activity data for the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: activities } = await supabase
                .from('user_activity_log')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: true });
            // Process activity data into chart format
            const activityMap = new Map();
            activities?.forEach(activity => {
                const date = new Date(activity.created_at).toISOString().split('T')[0];
                const current = activityMap.get(date) || { score: 0, activities: 0 };
                activityMap.set(date, {
                    score: current.score + (activity.activity_data?.score || 1),
                    activities: current.activities + 1
                });
            });
            const chartData = Array.from(activityMap.entries()).map(([date, data]) => ({
                date,
                score: data.score,
                activities: data.activities
            }));
            setActivityData(chartData);
            // Calculate overview stats
            const totalActivities = activities?.length || 0;
            const avgScore = chartData.length > 0
                ? chartData.reduce((sum, day) => sum + day.score, 0) / chartData.length
                : 0;
            setOverviewStats({
                totalActivities,
                contentCompleted: Math.floor(totalActivities * 0.7), // Simulated
                avgScore: Math.round(avgScore * 10) / 10,
                streakDays: calculateStreak(chartData),
                totalTimeSpent: Math.floor(totalActivities * 15) // Simulated minutes
            });
        }
        catch (error) {
            console.error('Error loading overview data:', error);
        }
    };
    const loadContentMastery = async () => {
        if (!userId)
            return;
        try {
            // Simulate content mastery data since we don't have a direct table
            const { data: activities } = await supabase
                .from('user_activity_log')
                .select(`
          *,
          content_items(
            id,
            title,
            content_type,
            thumbnail_url
          )
        `)
                .eq('user_id', userId)
                .eq('activity_type', 'content_completed')
                .order('created_at', { ascending: false })
                .limit(50);
            const masteryData = activities?.map(activity => ({
                id: activity.id,
                content_item: activity.content_items || {
                    title: 'Content Item',
                    content_type: 'document',
                    thumbnail_url: null
                },
                practiced_at: activity.created_at,
                completion_score: activity.activity_data?.score || Math.floor(Math.random() * 40) + 60
            })) || [];
            setContentMastery(masteryData);
        }
        catch (error) {
            console.error('Error loading content mastery:', error);
        }
    };
    const loadCourseProgress = async () => {
        if (!userId)
            return;
        try {
            // Simulate course progress data
            const mockCourses = [
                {
                    id: '1',
                    course_title: 'AI Fundamentals',
                    progress_percentage: 75,
                    lessons_completed: 6,
                    total_lessons: 8,
                    last_accessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: '2',
                    course_title: 'Advanced Prompt Engineering',
                    progress_percentage: 45,
                    lessons_completed: 9,
                    total_lessons: 20,
                    last_accessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: '3',
                    course_title: 'Machine Learning Basics',
                    progress_percentage: 100,
                    lessons_completed: 12,
                    total_lessons: 12,
                    last_accessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            setCourseProgress(mockCourses);
        }
        catch (error) {
            console.error('Error loading course progress:', error);
        }
    };
    const calculateStreak = (data) => {
        if (data.length === 0)
            return 0;
        let streak = 0;
        const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        for (const day of sortedData) {
            if (day.activities > 0) {
                streak++;
            }
            else {
                break;
            }
        }
        return streak;
    };
    useEffect(() => {
        loadUserDetails();
    }, [loadUserDetails]);
    useEffect(() => {
        if (activeTab === 'content') {
            loadContentMastery();
        }
        else if (activeTab === 'courses') {
            loadCourseProgress();
        }
    }, [activeTab, userId]);
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getContentTypeIcon = (type) => {
        switch (type) {
            case 'ai_agent':
                return _jsx(MessageSquare, { size: 16, className: "text-blue-500" });
            case 'video':
                return _jsx(PlayCircle, { size: 16, className: "text-red-500" });
            case 'document':
                return _jsx(FileText, { size: 16, className: "text-green-500" });
            default:
                return _jsx(BookOpen, { size: 16, className: "text-gray-500" });
        }
    };
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: overviewStats.totalActivities }), _jsx("div", { className: "text-sm text-blue-800", children: "Total Activities" })] }), _jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: overviewStats.contentCompleted }), _jsx("div", { className: "text-sm text-green-800", children: "Content Completed" })] }), _jsxs("div", { className: "bg-purple-50 border border-purple-200 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: overviewStats.avgScore }), _jsx("div", { className: "text-sm text-purple-800", children: "Avg Score" })] }), _jsxs("div", { className: "bg-orange-50 border border-orange-200 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: overviewStats.streakDays }), _jsx("div", { className: "text-sm text-orange-800", children: "Day Streak" })] }), _jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4 text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-gray-600", children: [overviewStats.totalTimeSpent, "m"] }), _jsx("div", { className: "text-sm text-gray-800", children: "Time Spent" })] })] }), _jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Activity Score (Last 30 Days)" }), _jsx("div", { className: "h-64", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: activityData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 12 }, tickFormatter: (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, { labelFormatter: (value) => formatDate(value), formatter: (value, name) => [
                                                        value,
                                                        name === 'score' ? 'Activity Score' : 'Activities Count'
                                                    ] }), _jsx(Line, { type: "monotone", dataKey: "score", stroke: "#3B82F6", strokeWidth: 2, dot: { fill: '#3B82F6', strokeWidth: 2, r: 4 } })] }) }) })] }), _jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Recent Activity" }), contentMastery.slice(0, 5).length > 0 ? (_jsx("div", { className: "space-y-3", children: contentMastery.slice(0, 5).map((item) => (_jsxs("div", { className: "flex items-center space-x-3 p-3 border border-gray-200 rounded-lg", children: [getContentTypeIcon(item.content_item.content_type), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: item.content_item.title }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Completed ", formatDateTime(item.practiced_at)] })] }), _jsxs("div", { className: "text-sm font-semibold text-green-600", children: [item.completion_score, "%"] })] }, item.id))) })) : (_jsx("p", { className: "text-gray-500 text-center py-4", children: "No recent activity" }))] })] }));
            case 'content':
                return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Content Mastery Log" }), _jsxs("div", { className: "text-sm text-gray-500", children: [contentMastery.length, " items practiced"] })] }), contentMastery.length > 0 ? (_jsx("div", { className: "space-y-3", children: contentMastery.map((item) => (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [getContentTypeIcon(item.content_item.content_type), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900", children: item.content_item.title }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Practiced on ", formatDateTime(item.practiced_at)] })] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-lg font-semibold text-green-600", children: [item.completion_score, "%"] }), _jsx("div", { className: "text-xs text-gray-500", children: "Completion" })] }), item.completion_score >= 90 && (_jsx(CheckCircle, { size: 20, className: "text-green-500" }))] })] }, item.id))) })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx(BookOpen, { size: 48, className: "mx-auto mb-4 text-gray-300" }), _jsx("p", { className: "text-gray-500", children: "No content practiced yet" })] }))] }));
            case 'courses':
                return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Course Progress" }), _jsxs("div", { className: "text-sm text-gray-500", children: [courseProgress.length, " courses enrolled"] })] }), courseProgress.length > 0 ? (_jsx("div", { className: "space-y-4", children: courseProgress.map((course) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: course.course_title }), _jsxs("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${course.progress_percentage === 100
                                                    ? 'bg-green-100 text-green-800'
                                                    : course.progress_percentage >= 50
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-yellow-100 text-yellow-800'}`, children: [course.progress_percentage, "% Complete"] })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between text-sm text-gray-600 mb-2", children: [_jsxs("span", { children: [course.lessons_completed, " of ", course.total_lessons, " lessons"] }), _jsxs("span", { children: ["Last accessed ", formatDate(course.last_accessed)] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300", style: { width: `${course.progress_percentage}%` } }) })] }), course.progress_percentage === 100 && (_jsxs("div", { className: "flex items-center text-green-600", children: [_jsx(CheckCircle, { size: 16, className: "mr-2" }), _jsx("span", { className: "text-sm font-medium", children: "Course Completed!" })] }))] }, course.id))) })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx(BookOpen, { size: 48, className: "mx-auto mb-4 text-gray-300" }), _jsx("p", { className: "text-gray-500", children: "No courses enrolled yet" })] }))] }));
            default:
                return null;
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: _jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    if (!user) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "User not found" }), _jsx("button", { onClick: () => navigate('/communities'), className: "mt-4 text-blue-600 hover:text-blue-800", children: "Back to Clients" })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "flex items-center justify-between py-6", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: () => navigate(-1), className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(ArrowLeft, { size: 24 }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold", style: { backgroundColor: user.client.brand_color }, children: [user.first_name.charAt(0).toUpperCase(), user.last_name.charAt(0).toUpperCase()] }), _jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900", children: [user.first_name, " ", user.last_name] }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Mail, { size: 16 }), _jsx("span", { children: user.email })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Calendar, { size: 16 }), _jsxs("span", { children: ["Joined ", formatDate(user.created_at)] })] }), user.last_active && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Activity, { size: 16 }), _jsxs("span", { children: ["Active ", formatDate(user.last_active)] })] }))] }), _jsxs("div", { className: "flex items-center space-x-4 mt-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [user.client.logo_url ? (_jsx("img", { src: user.client.logo_url, alt: user.client.name, className: "w-6 h-6 rounded-full" })) : (_jsx("div", { className: "w-6 h-6 rounded-full", style: { backgroundColor: user.client.brand_color } })), _jsx("span", { className: "text-sm text-gray-700", children: user.client.name })] }), user.tags.length > 0 && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Tag, { size: 16, className: "text-gray-400" }), _jsx("div", { className: "flex flex-wrap gap-1", children: user.tags.map(tag => (_jsx("span", { className: "inline-block px-2 py-1 text-xs text-white rounded-full", style: { backgroundColor: tag.color }, children: tag.name }, tag.id))) })] }))] })] })] })] }) }) }) }), _jsx("div", { className: "bg-white border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("nav", { className: "flex space-x-8", children: [
                            { id: 'overview', label: 'Overview', icon: TrendingUp },
                            { id: 'content', label: 'Content Mastery', icon: BookOpen },
                            { id: 'courses', label: 'Course Progress', icon: CheckCircle }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx(Icon, { size: 18 }), _jsx("span", { children: tab.label })] }, tab.id));
                        }) }) }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: renderTabContent() }) })] }));
};
export default UserDetailReport;
