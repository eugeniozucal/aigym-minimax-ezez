import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { X, Tag, Building2 } from 'lucide-react';
const tagColors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Yellow
    '#84CC16', // Lime
    '#10B981', // Green
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#A855F7', // Violet
    '#EC4899', // Pink
    '#F43F5E', // Rose
    '#6B7280' // Gray
];
export function TagModal({ isOpen, onClose, onSuccess, tag, communities }) {
    const [formData, setFormData] = useState({
        name: '',
        color: '#6B7280',
        community_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (tag) {
            setFormData({
                name: tag.name,
                color: tag.color,
                community_id: tag.community_id
            });
        }
        else {
            setFormData({
                name: '',
                color: '#6B7280',
                community_id: communities.length > 0 ? communities[0].id : ''
            });
        }
        setError('');
    }, [tag, communities, isOpen]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (!formData.community_id) {
            setError('Please select a community');
            setLoading(false);
            return;
        }
        try {
            const tagData = {
                name: formData.name.trim(),
                color: formData.color,
                community_id: formData.community_id
            };
            if (tag) {
                // Update existing tag
                const { error } = await supabase
                    .from('user_tags')
                    .update(tagData)
                    .eq('id', tag.id);
                if (error)
                    throw error;
            }
            else {
                // Create new tag
                const { error } = await supabase
                    .from('user_tags')
                    .insert([tagData]);
                if (error)
                    throw error;
            }
            onSuccess();
        }
        catch (error) {
            console.error('Error saving tag:', error);
            setError(error.message || 'An error occurred while saving the tag');
        }
        finally {
            setLoading(false);
        }
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const selectedCommunity = communities.find(c => c.id === formData.community_id);
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-xl max-w-md w-full", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "h-10 w-10 rounded-lg flex items-center justify-center", style: { backgroundColor: formData.color }, children: _jsx(Tag, { className: "h-5 w-5 text-white" }) }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: tag ? 'Edit Tag' : 'Create Tag' })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition-colors", disabled: loading, children: _jsx(X, { className: "h-6 w-6" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-sm text-red-800", children: error }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "community_id", className: "block text-sm font-medium text-gray-700 mb-2", children: "Community Organization" }), _jsxs("select", { id: "community_id", name: "community_id", required: true, value: formData.community_id, onChange: handleChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", disabled: loading || !!tag, children: [_jsx("option", { value: "", children: "Select a community..." }), communities.map((community) => (_jsx("option", { value: community.id, children: community.name }, community.id)))] }), selectedCommunity && (_jsxs("div", { className: "mt-2 flex items-center space-x-2 text-sm text-gray-600", children: [_jsx(Building2, { className: "h-4 w-4", style: { color: selectedCommunity.brand_color } }), _jsx("span", { children: selectedCommunity.project_name })] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-2", children: "Tag Name" }), _jsx("input", { type: "text", id: "name", name: "name", required: true, value: formData.name, onChange: handleChange, className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "e.g., Beginner, Advanced, VIP", disabled: loading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Tag Color" }), _jsx("div", { className: "grid grid-cols-7 gap-3", children: tagColors.map((color) => (_jsx("button", { type: "button", onClick: () => setFormData(prev => ({ ...prev, color })), className: `h-10 w-10 rounded-lg border-2 transition-all ${formData.color === color
                                            ? 'border-gray-400 scale-110 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'}`, style: { backgroundColor: color }, disabled: loading }, color))) }), _jsx("div", { className: "mt-3", children: _jsx("input", { type: "text", value: formData.color, onChange: (e) => setFormData(prev => ({ ...prev, color: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm", placeholder: "#6B7280", pattern: "^#[0-9A-Fa-f]{6}$", disabled: loading }) })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-6 border-t border-gray-200", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: loading ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm", className: "mr-2" }), tag ? 'Updating...' : 'Creating...'] })) : (tag ? 'Update Tag' : 'Create Tag') })] })] })] }) }));
}
