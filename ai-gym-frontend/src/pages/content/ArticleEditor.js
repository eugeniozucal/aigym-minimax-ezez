import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
function ArticleEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const [article, setArticle] = useState({
        title: '',
        content: '',
        excerpt: '',
        author: 'Admin User',
        category_id: null,
        status: 'draft',
        tags: [],
        featured_image_url: '',
        slug: '',
        seo_title: '',
        seo_description: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [activeTab, setActiveTab] = useState('content');
    const [notification, setNotification] = useState(null);
    useEffect(() => {
        fetchCategories();
        if (isEditing) {
            fetchArticle();
        }
    }, [id]);
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
    const fetchArticle = async () => {
        if (!id)
            return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('content_articles')
                .select('*')
                .eq('id', parseInt(id))
                .single();
            if (error)
                throw error;
            if (data) {
                setArticle({
                    ...data,
                    tags: data.tags || []
                });
            }
        }
        catch (error) {
            console.error('Error fetching article:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };
    const handleTitleChange = (title) => {
        setArticle(prev => ({
            ...prev,
            title,
            slug: prev.slug || generateSlug(title),
            seo_title: prev.seo_title || title
        }));
    };
    const addTag = () => {
        if (newTag.trim() && !article.tags.includes(newTag.trim())) {
            setArticle(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };
    const removeTag = (tagToRemove) => {
        setArticle(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };
    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };
    const handleSave = async (publishNow = false) => {
        try {
            setSaving(true);
            const articleData = {
                ...article,
                status: publishNow ? 'published' : article.status,
                published_at: publishNow ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            };
            if (isEditing) {
                const { error } = await supabase
                    .from('content_articles')
                    .update(articleData)
                    .eq('id', parseInt(id));
                if (error)
                    throw error;
                showNotification(publishNow ? 'Article published successfully!' : 'Article saved successfully!', 'success');
                // Delay navigation to show notification
                setTimeout(() => {
                    navigate('/content/articles');
                }, 1500);
            }
            else {
                const { data, error } = await supabase
                    .from('content_articles')
                    .insert([articleData])
                    .select()
                    .single();
                if (error)
                    throw error;
                showNotification(publishNow ? 'Article published successfully!' : 'Article created successfully!', 'success');
                // Delay navigation to show notification
                setTimeout(() => {
                    if (data) {
                        navigate(`/content/articles/${data.id}/edit`, { replace: true });
                    }
                    else {
                        navigate('/content/articles');
                    }
                }, 1500);
            }
        }
        catch (error) {
            console.error('Error saving article:', error);
            showNotification('Failed to save article. Please try again.', 'error');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }) }));
    }
    return (_jsxs(Layout, { children: [notification && (_jsx("div", { className: "fixed top-4 right-4 z-50 transition-all duration-500 ease-in-out transform translate-x-0 opacity-100", children: _jsx("div", { className: `max-w-sm w-full ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`, children: _jsx("div", { className: "flex-1 w-0 p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "ml-3 flex-1", children: _jsx("p", { className: "text-sm font-medium text-white", children: notification.message }) }), _jsx("div", { className: "ml-4 flex-shrink-0 flex", children: _jsxs("button", { className: "bg-transparent rounded-md inline-flex text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white", onClick: () => setNotification(null), children: [_jsx("span", { className: "sr-only", children: "Close" }), _jsx("svg", { className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) })] }) })] }) }) }) })), _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: () => navigate('/content/articles'), className: "p-2 hover:bg-gray-100 rounded-md", children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: isEditing ? 'Edit Article' : 'Create New Article' }), _jsx("p", { className: "text-gray-600", children: "Write and publish your content" })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: () => handleSave(false), disabled: saving, className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save Draft"] }), _jsxs("button", { onClick: () => handleSave(true), disabled: saving, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), "Publish"] })] })] }), _jsx("div", { className: "border-b border-gray-200", children: _jsxs("nav", { className: "-mb-px flex space-x-8", children: [_jsx("button", { onClick: () => setActiveTab('content'), className: `py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'content'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: "Content" }), _jsx("button", { onClick: () => setActiveTab('settings'), className: `py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: "Settings" }), _jsx("button", { onClick: () => setActiveTab('seo'), className: `py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'seo'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: "SEO" })] }) }), activeTab === 'content' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Title *" }), _jsx("input", { type: "text", value: article.title, onChange: (e) => handleTitleChange(e.target.value), placeholder: "Enter article title...", className: "w-full text-2xl font-bold border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 px-0 py-2", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Excerpt" }), _jsx("textarea", { value: article.excerpt, onChange: (e) => setArticle(prev => ({ ...prev, excerpt: e.target.value })), placeholder: "Brief description of the article...", rows: 3, className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Content *" }), _jsx("textarea", { value: article.content, onChange: (e) => setArticle(prev => ({ ...prev, content: e.target.value })), placeholder: "Write your article content here...", rows: 20, className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm", required: true }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "You can use HTML tags for formatting." })] })] })), activeTab === 'settings' && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Category" }), _jsxs("select", { value: article.category_id || '', onChange: (e) => setArticle(prev => ({
                                            ...prev,
                                            category_id: e.target.value ? parseInt(e.target.value) : null
                                        })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "No Category" }), categories.map(category => (_jsx("option", { value: category.id, children: category.name }, category.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Author" }), _jsx("input", { type: "text", value: article.author, onChange: (e) => setArticle(prev => ({ ...prev, author: e.target.value })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status" }), _jsxs("select", { value: article.status, onChange: (e) => setArticle(prev => ({
                                            ...prev,
                                            status: e.target.value
                                        })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "published", children: "Published" }), _jsx("option", { value: "archived", children: "Archived" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "URL Slug" }), _jsx("input", { type: "text", value: article.slug, onChange: (e) => setArticle(prev => ({ ...prev, slug: e.target.value })), placeholder: "article-url-slug", className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Featured Image URL" }), _jsx("input", { type: "url", value: article.featured_image_url, onChange: (e) => setArticle(prev => ({ ...prev, featured_image_url: e.target.value })), placeholder: "https://example.com/image.jpg", className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-2 mb-2", children: article.tags.map((tag, index) => (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: [tag, _jsx("button", { type: "button", onClick: () => removeTag(tag), className: "ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200", children: "\u00D7" })] }, index))) }), _jsxs("div", { className: "flex", children: [_jsx("input", { type: "text", value: newTag, onChange: (e) => setNewTag(e.target.value), onKeyPress: (e) => e.key === 'Enter' && addTag(), placeholder: "Add a tag...", className: "flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" }), _jsx("button", { type: "button", onClick: addTag, className: "px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 rounded-r-md hover:bg-gray-100", children: "Add" })] })] })] })), activeTab === 'seo' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "SEO Title" }), _jsx("input", { type: "text", value: article.seo_title, onChange: (e) => setArticle(prev => ({ ...prev, seo_title: e.target.value })), placeholder: "SEO optimized title...", className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Recommended: 50-60 characters" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "SEO Description" }), _jsx("textarea", { value: article.seo_description, onChange: (e) => setArticle(prev => ({ ...prev, seo_description: e.target.value })), placeholder: "Meta description for search engines...", rows: 4, className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Recommended: 150-160 characters" })] })] }))] })] }));
}
export default ArticleEditor;
