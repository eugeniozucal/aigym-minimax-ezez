import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, ArrowLeft, Eye, Target, Hash, Image as ImageIcon, Dumbbell, AlertCircle, CheckCircle, Clock } from 'lucide-react';
export function WODEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const [wod, setWod] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail_url: '',
        status: 'draft',
        estimated_duration_minutes: 30,
        difficulty_level: 'beginner',
        tags: []
    });
    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    useEffect(() => {
        if (isEditing && id) {
            fetchWOD(id);
        }
    }, [isEditing, id]);
    const fetchWOD = async (wodId) => {
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase.functions.invoke('wods-api', {
                method: 'GET',
                body: null,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (error) {
                throw new Error(error.message || 'Failed to fetch WOD');
            }
            if (!data?.data) {
                throw new Error('WOD not found');
            }
            // Find the specific WOD
            const wodData = Array.isArray(data.data)
                ? data.data.find((w) => w.id === wodId)
                : data.data.id === wodId ? data.data : null;
            if (!wodData) {
                throw new Error('WOD not found');
            }
            setWod(wodData);
            setFormData({
                title: wodData.title || '',
                description: wodData.description || '',
                thumbnail_url: wodData.thumbnail_url || '',
                status: wodData.status || 'draft',
                estimated_duration_minutes: wodData.estimated_duration_minutes || 30,
                difficulty_level: wodData.difficulty_level || 'beginner',
                tags: wodData.tags || []
            });
        }
        catch (err) {
            console.error('Error fetching WOD:', err);
            setError(err instanceof Error ? err.message : 'Failed to load WOD');
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (success)
            setSuccess(null);
        if (error)
            setError(null);
    };
    const handleTagAdd = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };
    const handleTagRemove = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTagAdd();
        }
    };
    const validateForm = () => {
        if (!formData.title.trim()) {
            return 'Title is required';
        }
        if (formData.estimated_duration_minutes <= 0) {
            return 'Duration must be greater than 0';
        }
        return null;
    };
    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `?id=${id}` : '';
            const { data, error } = await supabase.functions.invoke('wods-api' + url, {
                method,
                body: formData,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            });
            if (error) {
                throw new Error(error.message || `Failed to ${isEditing ? 'update' : 'create'} WOD`);
            }
            setSuccess(`WOD ${isEditing ? 'updated' : 'created'} successfully!`);
            if (!isEditing && data?.data?.id) {
                // Redirect to edit mode for newly created WOD
                setTimeout(() => {
                    navigate(`/training-zone/wods/${data.data.id}/edit`);
                }, 1500);
            }
        }
        catch (err) {
            console.error('Error saving WOD:', err);
            setError(err instanceof Error ? err.message : 'Failed to save WOD');
        }
        finally {
            setSaving(false);
        }
    };
    const handleBack = () => {
        navigate('/training-zone/wods');
    };
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading WOD..." })] }) }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: handleBack, className: "p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center", children: _jsx(Dumbbell, { className: "h-5 w-5 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: isEditing ? 'Edit WOD' : 'Create New WOD' }), _jsx("p", { className: "text-sm text-gray-600", children: isEditing ? 'Update your workout program' : 'Design a new workout of the day' })] })] })] }), _jsx("div", { className: "flex items-center space-x-3", children: _jsxs("button", { onClick: handleSave, disabled: saving, className: "inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all", children: [saving ? (_jsx(LoadingSpinner, { size: "sm", className: "mr-2" })) : (_jsx(Save, { className: "-ml-1 mr-2 h-4 w-4" })), saving ? 'Saving...' : (isEditing ? 'Update WOD' : 'Create WOD')] }) })] }), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 flex-shrink-0" }), _jsx("span", { className: "text-red-700", children: error })] })), success && (_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 flex-shrink-0" }), _jsx("span", { className: "text-green-700", children: success })] })), _jsx("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Basic Information" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "lg:col-span-2", children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-gray-700 mb-2", children: "Title *" }), _jsx("input", { type: "text", id: "title", value: formData.title, onChange: (e) => handleInputChange('title', e.target.value), placeholder: "Enter WOD title...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" })] }), _jsxs("div", { className: "lg:col-span-2", children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }), _jsx("textarea", { id: "description", rows: 4, value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), placeholder: "Describe this workout program...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "thumbnail_url", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(ImageIcon, { className: "inline h-4 w-4 mr-1" }), "Thumbnail URL"] }), _jsx("input", { type: "url", id: "thumbnail_url", value: formData.thumbnail_url, onChange: (e) => handleInputChange('thumbnail_url', e.target.value), placeholder: "https://example.com/image.jpg", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "status", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Eye, { className: "inline h-4 w-4 mr-1" }), "Publication Status"] }), _jsxs("select", { id: "status", value: formData.status, onChange: (e) => handleInputChange('status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500", children: [_jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "published", children: "Published" }), _jsx("option", { value: "archived", children: "Archived" })] })] })] })] }), _jsxs("div", { className: "border-t border-gray-200 pt-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Workout Details" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "duration", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Clock, { className: "inline h-4 w-4 mr-1" }), "Estimated Duration (minutes) *"] }), _jsx("input", { type: "number", id: "duration", min: "1", max: "300", value: formData.estimated_duration_minutes, onChange: (e) => handleInputChange('estimated_duration_minutes', parseInt(e.target.value) || 0), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "difficulty", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Target, { className: "inline h-4 w-4 mr-1" }), "Difficulty Level"] }), _jsxs("select", { id: "difficulty", value: formData.difficulty_level, onChange: (e) => handleInputChange('difficulty_level', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500", children: [_jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] })] })] }), _jsxs("div", { className: "border-t border-gray-200 pt-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: [_jsx(Hash, { className: "inline h-5 w-5 mr-1" }), "Tags"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", value: newTag, onChange: (e) => setNewTag(e.target.value), onKeyPress: handleKeyPress, placeholder: "Add a tag...", className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" }), _jsx("button", { type: "button", onClick: handleTagAdd, className: "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors", children: "Add" })] }), formData.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: formData.tags.map((tag, index) => (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800", children: [tag, _jsx("button", { type: "button", onClick: () => handleTagRemove(tag), className: "ml-2 text-orange-600 hover:text-orange-800", children: "\u00D7" })] }, index))) }))] })] }), formData.thumbnail_url && (_jsxs("div", { className: "border-t border-gray-200 pt-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Thumbnail Preview" }), _jsx("div", { className: "max-w-md", children: _jsx("img", { src: formData.thumbnail_url, alt: "Thumbnail preview", className: "w-full h-48 object-cover rounded-lg border border-gray-300", onError: (e) => {
                                                e.currentTarget.style.display = 'none';
                                            } }) })] }))] }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Next Steps" }), _jsxs("div", { className: "space-y-3 text-sm text-gray-600", children: [_jsx("p", { children: "\u2022 After saving your WOD, you can add pages and content blocks using the page builder" }), _jsx("p", { children: "\u2022 Use the assignment system to distribute this WOD to specific communities or users" }), _jsx("p", { children: "\u2022 Monitor engagement and completion rates through the analytics dashboard" })] })] })] }) }));
}
export default WODEditor;
