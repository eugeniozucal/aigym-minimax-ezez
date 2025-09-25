import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Plus, Search, Filter, Edit, Trash2, Eye, Calendar, User, Tag, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
function ArticlesManagement() {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    useEffect(() => {
        fetchArticles();
        fetchCategories();
    }, []);
    const fetchArticles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('content_articles')
                .select(`
          *,
          content_categories (
            id,
            name,
            color
          )
        `)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setArticles(data || []);
        }
        catch (error) {
            console.error('Error fetching articles:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('content_categories')
                .select('*')
                .order('name');
            if (error)
                throw error;
            setCategories(data || []);
        }
        catch (error) {
            console.error('Error fetching categories:', error);
        }
    };
    const deleteArticle = async (id) => {
        if (!confirm('Are you sure you want to delete this article?'))
            return;
        try {
            const { error } = await supabase
                .from('content_articles')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            await fetchArticles();
        }
        catch (error) {
            console.error('Error deleting article:', error);
        }
    };
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' ||
            article.category_id?.toString() === selectedCategory;
        const matchesStatus = selectedStatus === 'all' || article.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });
    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Draft' },
            published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Published' },
            archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Archived' }
        };
        const config = statusConfig[status];
        return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`, children: config.label }));
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return '-';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Articles Management" }), _jsx("p", { className: "text-gray-600", children: "Create and manage your content articles" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: () => setShowFilters(!showFilters), className: "inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: [_jsx(Filter, { className: "h-4 w-4 mr-2" }), "Filters"] }), _jsxs(Link, { to: "/content/articles/create", className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add New Article"] })] })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg border border-gray-200 space-y-4", children: [_jsx("div", { className: "flex flex-col sm:flex-row gap-4", children: _jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search articles by title or author...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" })] }) }) }), showFilters && (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Category" }), _jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: "All Categories" }), categories.map(category => (_jsx("option", { value: category.id.toString(), children: category.name }, category.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status" }), _jsxs("select", { value: selectedStatus, onChange: (e) => setSelectedStatus(e.target.value), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: "All Statuses" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "published", children: "Published" }), _jsx("option", { value: "archived", children: "Archived" })] })] })] }))] }), _jsx("div", { className: "bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Title" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Category" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Author" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Created At" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredArticles.length === 0 ? (_jsx("tr", { children: _jsxs("td", { colSpan: 6, className: "px-6 py-12 text-center", children: [_jsx(FileText, { className: "mx-auto h-12 w-12 text-gray-300" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No articles found" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                                                        ? 'Try adjusting your search or filters.'
                                                        : 'Get started by creating your first article.' })] }) })) : (filteredArticles.map((article) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("div", { className: "text-sm font-medium text-gray-900 mb-1", children: article.title }), article.excerpt && (_jsx("div", { className: "text-sm text-gray-500 line-clamp-2", children: article.excerpt }))] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: article.content_categories ? (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 rounded-full mr-2", style: { backgroundColor: article.content_categories.color } }), _jsx("span", { className: "text-sm text-gray-900", children: article.content_categories.name })] })) : (_jsx("span", { className: "text-sm text-gray-500", children: "Uncategorized" })) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "h-4 w-4 text-gray-400 mr-2" }), _jsx("span", { className: "text-sm text-gray-900", children: article.author })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: getStatusBadge(article.status) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 text-gray-400 mr-2" }), _jsx("span", { className: "text-sm text-gray-900", children: formatDate(article.created_at) })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs("div", { className: "flex items-center justify-end space-x-2", children: [_jsx(Link, { to: `/content/articles/${article.id}/edit`, className: "text-blue-600 hover:text-blue-900 p-1", children: _jsx(Eye, { className: "h-4 w-4" }) }), _jsx(Link, { to: `/content/articles/${article.id}/edit`, className: "text-indigo-600 hover:text-indigo-900 p-1", children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => deleteArticle(article.id), className: "text-red-600 hover:text-red-900 p-1", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, article.id)))) })] }) }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center", children: [_jsx(FileText, { className: "h-8 w-8 text-blue-500" }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Total Articles" }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: articles.length })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Eye, { className: "h-8 w-8 text-green-500" }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Published" }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: articles.filter(a => a.status === 'published').length })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Edit, { className: "h-8 w-8 text-yellow-500" }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Drafts" }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: articles.filter(a => a.status === 'draft').length })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Tag, { className: "h-8 w-8 text-purple-500" }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-500", children: "Categories" }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: categories.length })] })] }) })] })] }) }));
}
export default ArticlesManagement;
