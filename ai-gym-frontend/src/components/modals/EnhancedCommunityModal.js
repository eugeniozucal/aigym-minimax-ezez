import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { supabase, createCommunityFromTemplate } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { X, Upload, Palette, Key, Copy, Image, AlertCircle } from 'lucide-react';
export function CommunityModal({ community, apiKeys, communities, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        project_name: '',
        logo_url: '',
        brand_color: '#3B82F6',
        forum_enabled: false,
        api_key_id: ''
    });
    // Template creation state
    const [useTemplate, setUseTemplate] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [includeContent, setIncludeContent] = useState(false);
    // Logo upload state
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState('');
    const fileInputRef = useRef(null);
    // Validation state
    const [nameError, setNameError] = useState('');
    useEffect(() => {
        if (community) {
            setFormData({
                name: community.name,
                project_name: community.project_name,
                logo_url: community.logo_url || '',
                brand_color: community.brand_color,
                forum_enabled: community.forum_enabled,
                api_key_id: community.api_key_id || ''
            });
            setLogoPreview(community.logo_url || '');
        }
        else {
            setFormData({
                name: '',
                project_name: '',
                logo_url: '',
                brand_color: '#3B82F6',
                forum_enabled: false,
                api_key_id: ''
            });
            setLogoPreview('');
        }
    }, [community]);
    const validateName = async (name) => {
        if (!name.trim()) {
            setNameError('Community name is required');
            return false;
        }
        // Check for unique name (excluding current community if editing)
        const { data, error } = await supabase
            .from('communities')
            .select('id')
            .eq('name', name.trim())
            .neq('id', community?.id || '');
        if (error) {
            console.error('Error validating name:', error);
            return false;
        }
        if (data && data.length > 0) {
            setNameError('A community with this name already exists');
            return false;
        }
        setNameError('');
        return true;
    };
    const handleLogoUpload = async (file) => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Logo file must be less than 5MB');
            return;
        }
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }
        try {
            setLogoUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            // For now, we'll use a placeholder URL since we don't have storage setup
            // In production, this would upload to Supabase Storage
            const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Community')}&size=256&background=${formData.brand_color.substring(1)}&color=ffffff`;
            setFormData(prev => ({ ...prev, logo_url: placeholderUrl }));
            setLogoPreview(placeholderUrl);
        }
        catch (error) {
            console.error('Error uploading logo:', error);
            alert('Failed to upload logo. Please try again.');
        }
        finally {
            setLogoUploading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = await validateName(formData.name);
        if (!isValid)
            return;
        setLoading(true);
        try {
            if (useTemplate && selectedTemplate && !community) {
                // Create from template
                await createCommunityFromTemplate({
                    sourceCommunityId: selectedTemplate,
                    newCommunityName: formData.name,
                    newProjectName: formData.project_name || undefined,
                    includeContent,
                    logoUrl: formData.logo_url || undefined,
                    colorHex: formData.brand_color,
                    hasForumToggle: formData.forum_enabled,
                    apiKeyId: formData.api_key_id || undefined
                });
            }
            else {
                // Regular create/update
                const communityData = {
                    name: formData.name.trim(),
                    project_name: formData.project_name.trim() || formData.name.trim(),
                    logo_url: formData.logo_url || null,
                    brand_color: formData.brand_color,
                    forum_enabled: formData.forum_enabled,
                    api_key_id: formData.api_key_id || null,
                    status: 'active'
                };
                if (community) {
                    // Update existing community
                    const { error } = await supabase
                        .from('communities')
                        .update({ ...communityData, updated_at: new Date().toISOString() })
                        .eq('id', community.id);
                    if (error)
                        throw error;
                }
                else {
                    // Create new community
                    const { error } = await supabase
                        .from('communities')
                        .insert([communityData]);
                    if (error)
                        throw error;
                }
            }
            onSave();
        }
        catch (error) {
            console.error('Error saving community:', error);
            alert('Failed to save community. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const getTemplateOptions = () => {
        return communities.filter(c => c.status === 'active' && c.id !== community?.id);
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: community ? 'Edit Community' : 'Create New Community' }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [!community && (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [_jsx(Copy, { className: "h-5 w-5 text-blue-500" }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Start from Template" })] }), _jsxs("label", { className: "flex items-center space-x-2 mb-4", children: [_jsx("input", { type: "checkbox", checked: useTemplate, onChange: (e) => {
                                                setUseTemplate(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedTemplate('');
                                                    setIncludeContent(false);
                                                }
                                            }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700", children: "Create this community from an existing template" })] }), useTemplate && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Select Template Community" }), _jsxs("select", { value: selectedTemplate, onChange: (e) => setSelectedTemplate(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", required: useTemplate, children: [_jsx("option", { value: "", children: "Choose a community to use as template..." }), getTemplateOptions().map((templateCommunity) => (_jsxs("option", { value: templateCommunity.id, children: [templateCommunity.name, " - ", templateCommunity.project_name] }, templateCommunity.id)))] })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: includeContent, onChange: (e) => setIncludeContent(e.target.checked), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700", children: "Include all content from template" })] })] }))] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-2", children: "Community Name *" }), _jsx("input", { type: "text", id: "name", value: formData.name, onChange: (e) => {
                                                setFormData(prev => ({ ...prev, name: e.target.value }));
                                                setNameError('');
                                            }, onBlur: (e) => validateName(e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${nameError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`, placeholder: "Enter community name", required: true }), nameError && (_jsxs("div", { className: "mt-1 flex items-center text-sm text-red-600", children: [_jsx(AlertCircle, { className: "h-4 w-4 mr-1" }), nameError] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "project_name", className: "block text-sm font-medium text-gray-700 mb-2", children: "Project Name" }), _jsx("input", { type: "text", id: "project_name", value: formData.project_name, onChange: (e) => setFormData(prev => ({ ...prev, project_name: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Enter project name" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Community Logo" }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "flex-shrink-0", children: logoPreview ? (_jsx("img", { src: logoPreview, alt: "Logo preview", className: "h-16 w-16 rounded-lg object-cover border border-gray-300" })) : (_jsx("div", { className: "h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center", children: _jsx(Image, { className: "h-6 w-6 text-gray-400" }) })) }), _jsxs("div", { className: "flex-1", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file)
                                                            handleLogoUpload(file);
                                                    }, className: "hidden" }), _jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: logoUploading, className: "inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: logoUploading ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm", className: "mr-2" }), "Uploading..."] })) : (_jsxs(_Fragment, { children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Upload Logo"] })) })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "brand_color", className: "block text-sm font-medium text-gray-700 mb-2", children: "Brand Color *" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "h-10 w-10 rounded-lg border border-gray-300 cursor-pointer", style: { backgroundColor: formData.brand_color }, onClick: () => {
                                                        const input = document.createElement('input');
                                                        input.type = 'color';
                                                        input.value = formData.brand_color;
                                                        input.onchange = (e) => {
                                                            setFormData(prev => ({ ...prev, brand_color: e.target.value }));
                                                        };
                                                        input.click();
                                                    }, children: _jsx(Palette, { className: "h-4 w-4 text-white m-3" }) }), _jsx("input", { type: "text", id: "brand_color", value: formData.brand_color, onChange: (e) => setFormData(prev => ({ ...prev, brand_color: e.target.value })), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono", placeholder: "#3B82F6", pattern: "^#[0-9A-Fa-f]{6}$", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "api_key_id", className: "block text-sm font-medium text-gray-700 mb-2", children: "API Key" }), _jsxs("div", { className: "relative", children: [_jsx(Key, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }), _jsxs("select", { id: "api_key_id", value: formData.api_key_id, onChange: (e) => setFormData(prev => ({ ...prev, api_key_id: e.target.value })), className: "w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "Select an API key..." }), apiKeys.map((key) => (_jsxs("option", { value: key.id, children: [key.name, " (", key.provider, ")"] }, key.id)))] })] })] })] }), _jsx("div", { children: _jsxs("label", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "checkbox", checked: formData.forum_enabled, onChange: (e) => setFormData(prev => ({ ...prev, forum_enabled: e.target.checked })), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Enable Forum" }), _jsx("p", { className: "text-sm text-gray-500", children: "Allow users to participate in community discussions" })] })] }) }), _jsxs("div", { className: "flex items-center justify-end space-x-3 pt-6 border-t border-gray-200", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" }), _jsxs("button", { type: "submit", disabled: loading, className: "inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [loading && _jsx(LoadingSpinner, { size: "sm", className: "mr-2" }), community ? 'Update Community' : 'Create Community'] })] })] })] }) }));
}
