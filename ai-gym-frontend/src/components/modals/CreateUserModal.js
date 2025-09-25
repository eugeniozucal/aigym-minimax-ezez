import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X, User, Mail, Tag, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
const CreateUserModal = ({ isOpen, onClose, communityId, availableTags, onUserCreated }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [createdUser, setCreatedUser] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        selectedTags: []
    });
    const validateForm = () => {
        const newErrors = {};
        // First name validation
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        else if (formData.firstName.length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters';
        }
        // Last name validation
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        else if (formData.lastName.length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters';
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        }
        else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const generateSecurePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };
    const handleTagToggle = (tagId) => {
        setFormData(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.includes(tagId)
                ? prev.selectedTags.filter(id => id !== tagId)
                : [...prev.selectedTags, tagId]
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);
        try {
            // Generate secure password
            const tempPassword = generateSecurePassword();
            // Create user
            const userData = {
                community_id: communityId,
                email: formData.email.trim(),
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                created_at: new Date().toISOString()
            };
            const { data: user, error: userError } = await supabase
                .from('users')
                .insert([userData])
                .select()
                .single();
            if (userError) {
                if (userError.code === '23505') {
                    setErrors({ email: 'A user with this email already exists' });
                    return;
                }
                throw userError;
            }
            // Assign tags if selected
            if (formData.selectedTags.length > 0) {
                const tagAssignments = formData.selectedTags.map(tagId => ({
                    user_id: user.id,
                    tag_id: tagId,
                    assigned_at: new Date().toISOString()
                }));
                const { error: tagError } = await supabase
                    .from('user_tag_assignments')
                    .insert(tagAssignments);
                if (tagError) {
                    console.error('Error assigning tags:', tagError);
                    // Don't fail the whole operation for tag assignment errors
                }
            }
            // Set created user info for display
            setCreatedUser({
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                tempPassword
            });
            onUserCreated();
        }
        catch (error) {
            console.error('Error creating user:', error);
            alert('Error creating user: ' + error.message);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleClose = () => {
        if (!isLoading) {
            resetForm();
            onClose();
        }
    };
    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            selectedTags: []
        });
        setErrors({});
        setCreatedUser(null);
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Could show a toast notification here
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: createdUser ? 'User Created Successfully!' : 'Create New User' }), _jsx("button", { onClick: handleClose, disabled: isLoading, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { size: 24 }) })] }), _jsx("div", { className: "p-6", children: !createdUser ? (
                    /* Create User Form */
                    _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "First Name *" }), _jsxs("div", { className: "relative", children: [_jsx(User, { size: 18, className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: formData.firstName, onChange: (e) => setFormData(prev => ({ ...prev, firstName: e.target.value })), className: `w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`, placeholder: "John" })] }), errors.firstName && (_jsxs("p", { className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertTriangle, { size: 14, className: "mr-1" }), errors.firstName] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Last Name *" }), _jsxs("div", { className: "relative", children: [_jsx(User, { size: 18, className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", value: formData.lastName, onChange: (e) => setFormData(prev => ({ ...prev, lastName: e.target.value })), className: `w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Doe" })] }), errors.lastName && (_jsxs("p", { className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertTriangle, { size: 14, className: "mr-1" }), errors.lastName] }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email Address *" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 18, className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData(prev => ({ ...prev, email: e.target.value })), className: `w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`, placeholder: "john.doe@example.com" })] }), errors.email && (_jsxs("p", { className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertTriangle, { size: 14, className: "mr-1" }), errors.email] }))] }), availableTags.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Assign Tags (Optional)" }), _jsx("div", { className: "flex flex-wrap gap-2", children: availableTags.map(tag => (_jsxs("button", { type: "button", onClick: () => handleTagToggle(tag.id), className: `inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors ${formData.selectedTags.includes(tag.id)
                                                ? 'text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, style: {
                                                backgroundColor: formData.selectedTags.includes(tag.id) ? tag.color : undefined
                                            }, children: [_jsx(Tag, { size: 14, className: "mr-1" }), tag.name] }, tag.id))) }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Click tags to assign them to this user" })] })), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3", children: _jsxs("p", { className: "text-sm text-blue-800", children: [_jsx("strong", { children: "Note:" }), " A secure temporary password will be automatically generated for this user."] }) }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: handleClose, disabled: isLoading, className: "px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors", children: "Cancel" }), _jsxs("button", { type: "submit", disabled: isLoading, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", children: [isLoading && (_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })), _jsx("span", { children: isLoading ? 'Creating...' : 'Create User' })] })] })] })) : (
                    /* Success State */
                    _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "mb-4", children: [_jsx(CheckCircle, { size: 64, className: "mx-auto text-green-500 mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "User Created Successfully!" }), _jsxs("p", { className: "text-gray-600", children: [createdUser.firstName, " ", createdUser.lastName, " has been added to the system."] })] }), _jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6", children: [_jsx("h4", { className: "text-sm font-semibold text-yellow-800 mb-3", children: "\uD83D\uDD11 User Credentials" }), _jsxs("div", { className: "space-y-3 text-left", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-yellow-700 mb-1", children: "Email:" }), _jsxs("div", { className: "flex items-center justify-between bg-white rounded px-3 py-2 border", children: [_jsx("span", { className: "font-mono text-sm", children: createdUser.email }), _jsx("button", { onClick: () => copyToClipboard(createdUser.email), className: "text-yellow-600 hover:text-yellow-800 text-xs", children: "Copy" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-yellow-700 mb-1", children: "Temporary Password:" }), _jsxs("div", { className: "flex items-center justify-between bg-white rounded px-3 py-2 border", children: [_jsx("span", { className: "font-mono text-sm", children: createdUser.tempPassword }), _jsx("button", { onClick: () => copyToClipboard(createdUser.tempPassword), className: "text-yellow-600 hover:text-yellow-800 text-xs", children: "Copy" })] })] })] }), _jsxs("p", { className: "text-xs text-yellow-700 mt-3", children: ["\u26A0\uFE0F ", _jsx("strong", { children: "Important:" }), " Save these credentials now. The password will not be shown again."] })] }), _jsx("button", { onClick: handleClose, className: "px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", children: "Done" })] })) })] }) }));
};
export default CreateUserModal;
