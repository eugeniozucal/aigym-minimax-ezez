import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Bot, Play, FileText, MessageSquare, Zap, Plus, Search, Filter, Image, FileType } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
const CONTENT_TYPES_BASE = [
    {
        type: 'articles',
        label: 'Articles',
        icon: FileText,
        color: '#10B981',
        description: 'Blog posts, tutorials, and written content',
        count: 0
    },
    {
        type: 'ai-agents',
        label: 'AI Agents',
        icon: Bot,
        color: '#3B82F6',
        description: 'Intelligent AI agents with custom prompts',
        count: 0
    },
    {
        type: 'videos',
        label: 'Videos',
        icon: Play,
        color: '#EF4444',
        description: 'Educational videos with transcriptions',
        count: 0
    },
    {
        type: 'documents',
        label: 'Documents',
        icon: FileText,
        color: '#10B981',
        description: 'Rich text documents and guides',
        count: 0
    },
    {
        type: 'images',
        label: 'Images',
        icon: Image,
        color: '#06B6D4',
        description: 'Image assets and visual content',
        count: 0
    },
    {
        type: 'pdfs',
        label: 'PDFs',
        icon: FileType,
        color: '#DC2626',
        description: 'PDF documents and resources',
        count: 0
    },
    {
        type: 'prompts',
        label: 'Prompts',
        icon: MessageSquare,
        color: '#8B5CF6',
        description: 'Reusable prompt templates',
        count: 0
    },
    {
        type: 'automations',
        label: 'Automations',
        icon: Zap,
        color: '#F59E0B',
        description: 'Process automations and workflows',
        count: 0
    }
];
function ContentManagement() {
    const [contentTypes, setContentTypes] = useState(CONTENT_TYPES_BASE);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchContentCounts();
    }, []);
    const fetchContentCounts = async () => {
        try {
            setLoading(true);
            // Fetch articles count
            const { count: articlesCount } = await supabase
                .from('content_articles')
                .select('*', { count: 'exact', head: true });
            // Update content types with actual counts
            const updatedTypes = CONTENT_TYPES_BASE.map(type => {
                switch (type.type) {
                    case 'articles':
                        return { ...type, count: articlesCount || 0 };
                    // Add other content type counts here when their tables exist
                    // case 'ai-agents':
                    //   return { ...type, count: aiAgentsCount || 0 }
                    default:
                        return type;
                }
            });
            setContentTypes(updatedTypes);
        }
        catch (error) {
            console.error('Error fetching content counts:', error);
            setContentTypes(CONTENT_TYPES_BASE); // Fallback to base types
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-8", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Content Management" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Create and manage content for your AI platform" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: contentTypes.map((contentType) => {
                        const Icon = contentType.icon;
                        return (_jsxs(Link, { to: `/content/${contentType.type}`, className: "bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform", style: { backgroundColor: contentType.color + '20' }, children: _jsx(Icon, { className: "h-6 w-6", style: { color: contentType.color } }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors", children: contentType.label }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: contentType.description })] })] }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsxs("span", { className: "text-sm text-gray-500", children: [contentType.count, " items"] }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs(Link, { to: `/content/${contentType.type}/create`, className: "inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", onClick: (e) => e.stopPropagation(), children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), "Create"] }) })] })] }, contentType.type));
                    }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("button", { className: "flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx(Search, { className: "h-5 w-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Search Content" }), _jsx("p", { className: "text-sm text-gray-500", children: "Find existing content" })] })] }), _jsxs("button", { className: "flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx(Filter, { className: "h-5 w-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Filter by Tags" }), _jsx("p", { className: "text-sm text-gray-500", children: "Organize content" })] })] }), _jsxs(Link, { to: "/content/ai-agents/create", className: "flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx(Bot, { className: "h-5 w-5 text-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Quick Agent" }), _jsx("p", { className: "text-sm text-gray-500", children: "Create new AI agent" })] })] }), _jsxs(Link, { to: "/content/articles/create", className: "flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx(FileText, { className: "h-5 w-5 text-green-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "New Article" }), _jsx("p", { className: "text-sm text-gray-500", children: "Write blog posts and tutorials" })] })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Recent Activity" }), _jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "mx-auto h-12 w-12 text-gray-300" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No recent activity" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Content creation and editing activity will appear here" })] })] })] }) }));
}
export default ContentManagement;
