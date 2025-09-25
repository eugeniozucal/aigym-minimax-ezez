import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Palette, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
const CommunityModal = ({ isOpen, onClose, onCommunityCreated, editingCommunity }) => {
    const fileInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [availableApiKeys, setAvailableApiKeys] = useState([]);
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        communityName: editingCommunity?.name || '',
        projectName: editingCommunity?.project_name || '',
        logoFile: null,
        logoPreview: editingCommunity?.logo_url || '',
        brandColor: editingCommunity?.brand_color || '#3B82F6',
        apiKeyId: editingCommunity?.api_key_id || '',
        forumEnabled: editingCommunity?.forum_enabled ?? true,
        startFromTemplate: false,
        templateId: '',
        includeContent: false
    });
    // Load available API keys and templates when modal opens
    React.useEffect(() => {
        if (isOpen && !editingCommunity) {
            loadAvailableOptions();
        }
    }, [isOpen]);
    const loadAvailableOptions = async () => {
        try {
            // Load API keys
            const { data: apiKeys } = await supabase
                .from('api_keys')
                .select('id, name, key_type')
                .eq('status', 'active')
                .order('name');
            if (apiKeys) {
                setAvailableApiKeys(apiKeys);
            }
            // Load community templates
            const { data: templates } = await supabase
                .from('communities')
                .select('id, name, project_name')
                .eq('is_template', true)
                .eq('status', 'active')
                .order('name');
            if (templates) {
                setAvailableTemplates(templates);
            }
        }
        catch (error) {
            console.error('Error loading options:', error);
        }
    };
    const validateForm = () => {
        const newErrors = {};
        // Community name validation
        if (!formData.communityName.trim()) {
            newErrors.communityName = 'Community name is required';
        }
        else if (formData.communityName.length < 2) {
            newErrors.communityName = 'Community name must be at least 2 characters';
        }
        // Brand color validation
        const hexColorRegex = /^#[0-9A-F]{6}$/i;
        if (!hexColorRegex.test(formData.brandColor)) {
            newErrors.brandColor = 'Please enter a valid HEX color code';
        }
        // API key validation
        if (!formData.apiKeyId && !formData.startFromTemplate) {
            newErrors.apiKeyId = 'Please select an API key';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleLogoUpload = useCallback((file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({
                    ...prev,
                    logoFile: file,
                    logoPreview: e.target?.result
                }));
            };
            reader.readAsDataURL(file);
        }
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleLogoUpload(files[0]);
        }
    }, [handleLogoUpload]);
    const handleFileInput = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleLogoUpload(files[0]);
        }
    }, [handleLogoUpload]);
    const uploadLogo = async () => {
        if (!formData.logoFile)
            return null;
        try {
            const fileExt = formData.logoFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `community-logos/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(filePath, formData.logoFile);
            if (uploadError)
                throw uploadError;
            const { data } = supabase.storage
                .from('assets')
                .getPublicUrl(filePath);
            return data.publicUrl;
        }
        catch (error) {
            console.error('Error uploading logo:', error);
            return null;
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);
        try {
            let logoUrl = formData.logoPreview;
            // Upload new logo if provided
            if (formData.logoFile) {
                const uploadedUrl = await uploadLogo();
                if (uploadedUrl) {
                    logoUrl = uploadedUrl;
                }
            }
            // Prepare community data
            const communityData = {
                name: formData.communityName.trim(),
                project_name: formData.projectName.trim() || null,
                logo_url: logoUrl,
                brand_color: formData.brandColor,
                api_key_id: formData.apiKeyId || null,
                forum_enabled: formData.forumEnabled,
                status: 'active',
                is_template: false
            };
            let result;
            if (editingCommunity) {
                // Update existing community
                const { data, error } = await supabase
                    .from('communities')
                    .update(communityData)
                    .eq('id', editingCommunity.id)
                    .select()
                    .single();
                result = { data, error };
            }
            else {
                // Create new community
                if (formData.startFromTemplate && formData.templateId) {
                    // Clone from template
                    const { data, error } = await supabase.functions.invoke('clone-community-template', {
                        body: {
                            template_id: formData.templateId,
                            community_data: communityData,
                            include_content: formData.includeContent
                        }
                    });
                    result = { data, error };
                }
                else {
                    // Create from scratch
                    const { data, error } = await supabase
                        .from('communities')
                        .insert([communityData])
                        .select()
                        .single();
                    result = { data, error };
                }
            }
            if (result.error) {
                if (result.error.code === '23505') {
                    setErrors({ communityName: 'A community with this name already exists' });
                    return;
                }
                throw result.error;
            }
            // Reset form and close modal
            resetForm();
            onCommunityCreated();
            onClose();
        }
        catch (error) {
            console.error('Error saving community:', error);
            // Show error toast or notification here
        }
        finally {
            setIsLoading(false);
        }
    };
    const resetForm = () => {
        setFormData({
            communityName: '',
            projectName: '',
            logoFile: null,
            logoPreview: '',
            brandColor: '#3B82F6',
            apiKeyId: '',
            forumEnabled: true,
            startFromTemplate: false,
            templateId: '',
            includeContent: false
        });
        setErrors({});
    };
    const handleClose = () => {
        if (!isLoading) {
            resetForm();
            onClose();
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: editingCommunity ? 'Edit Community' : 'Create New Community' }), _jsx("button", { onClick: handleClose, disabled: isLoading, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [!editingCommunity && (_jsxs("div", { className: "border rounded-lg p-4 bg-gray-50", children: [_jsxs("label", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "checkbox", checked: formData.startFromTemplate, onChange: (e) => setFormData(prev => ({ ...prev, startFromTemplate: e.target.checked })), className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Start from Template" })] }), formData.startFromTemplate && (_jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Select Template" }), _jsxs("select", { value: formData.templateId, onChange: (e) => setFormData(prev => ({ ...prev, templateId: e.target.value })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", required: formData.startFromTemplate, children: [_jsx("option", { value: "", children: "Select a template..." }), availableTemplates.map((template) => (_jsxs("option", { value: template.id, children: [template.name, " ", template.project_name && `(${template.project_name})`] }, template.id)))] })] }), _jsxs("label", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "checkbox", checked: formData.includeContent, onChange: (e) => setFormData(prev => ({ ...prev, includeContent: e.target.checked })), className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-600", children: "Include all content (agents, documents, etc.)" })] })] }))] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Community Name *" }), _jsx("input", { type: "text", value: formData.communityName, onChange: (e) => setFormData(prev => ({ ...prev, communityName: e.target.value })), className: `w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.communityName ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Enter community name", required: true }), errors.communityName && (_jsxs("p", { className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertTriangle, { size: 16, className: "mr-1" }), errors.communityName] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Project Name" }), _jsx("input", { type: "text", value: formData.projectName, onChange: (e) => setFormData(prev => ({ ...prev, projectName: e.target.value })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Optional project name" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Community Logo" }), _jsxs("div", { className: "flex items-center space-x-6", children: [_jsx("div", { className: "flex-shrink-0", children: formData.logoPreview ? (_jsx("div", { className: "w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200", children: _jsx("img", { src: formData.logoPreview, alt: "Logo preview", className: "w-full h-full object-cover" }) })) : (_jsx("div", { className: "w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center", children: _jsx(Upload, { size: 24, className: "text-gray-400" }) })) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { onDrop: handleDrop, onDragOver: (e) => e.preventDefault(), onClick: () => fileInputRef.current?.click(), className: "border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors", children: [_jsx(Upload, { size: 24, className: "mx-auto mb-2 text-gray-400" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Drag and drop an image, or ", _jsx("span", { className: "text-blue-600", children: "click to browse" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Recommended: Square image, at least 200x200px" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileInput, className: "hidden" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Brand Color *" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 rounded-md border border-gray-300 cursor-pointer", style: { backgroundColor: formData.brandColor }, onClick: () => {
                                                        const input = document.createElement('input');
                                                        input.type = 'color';
                                                        input.value = formData.brandColor;
                                                        input.onchange = (e) => {
                                                            setFormData(prev => ({ ...prev, brandColor: e.target.value }));
                                                        };
                                                        input.click();
                                                    }, children: _jsx(Palette, { size: 16, className: "text-white m-2" }) }), _jsx("input", { type: "text", value: formData.brandColor, onChange: (e) => setFormData(prev => ({ ...prev, brandColor: e.target.value })), className: `flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${errors.brandColor ? 'border-red-500' : 'border-gray-300'}`, placeholder: "#3B82F6", pattern: "^#[0-9A-Fa-f]{6}$" })] }), errors.brandColor && (_jsxs("p", { className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertTriangle, { size: 16, className: "mr-1" }), errors.brandColor] }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["API Key ", !formData.startFromTemplate && '*'] }), _jsxs("select", { value: formData.apiKeyId, onChange: (e) => setFormData(prev => ({ ...prev, apiKeyId: e.target.value })), className: `w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.apiKeyId ? 'border-red-500' : 'border-gray-300'}`, required: !formData.startFromTemplate, children: [_jsx("option", { value: "", children: "Select an API key..." }), availableApiKeys.map((apiKey) => (_jsxs("option", { value: apiKey.id, children: [apiKey.name, " (", apiKey.key_type, ")"] }, apiKey.id)))] }), errors.apiKeyId && (_jsxs("p", { className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertTriangle, { size: 16, className: "mr-1" }), errors.apiKeyId] }))] })] }), _jsx("div", { children: _jsxs("label", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "checkbox", checked: formData.forumEnabled, onChange: (e) => setFormData(prev => ({ ...prev, forumEnabled: e.target.checked })), className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Enable Forum" }), _jsx("p", { className: "text-xs text-gray-500", children: "Allow users to participate in community discussions" })] })] }) }), _jsxs("div", { className: "flex items-center justify-end space-x-3 pt-6 border-t", children: [_jsx("button", { type: "button", onClick: handleClose, disabled: isLoading, className: "px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: "Cancel" }), _jsxs("button", { type: "submit", disabled: isLoading, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2", children: [isLoading && (_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })), _jsx("span", { children: editingCommunity ? 'Update Community' : 'Create Community' }), !isLoading && _jsx(Check, { size: 16 })] })] })] })] }) }));
};
export default CommunityModal;
