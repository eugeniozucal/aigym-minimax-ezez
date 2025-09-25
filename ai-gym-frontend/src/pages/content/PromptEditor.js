import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ContentEditor } from '@/components/content/ContentEditor';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MessageSquare, Copy, Hash, BarChart3, Clock, CheckCircle, Tag } from 'lucide-react';
const PROMPT_CATEGORIES = [
    'General',
    'Creative Writing',
    'Business',
    'Technical',
    'Educational',
    'Marketing',
    'Customer Support',
    'Data Analysis',
    'Programming',
    'Research',
    'Social Media',
    'Email',
    'Other'
];
export function PromptEditor() {
    const { id } = useParams();
    const isEdit = !!id;
    const [prompt, setPrompt] = useState(null);
    const [promptText, setPromptText] = useState('');
    const [promptCategory, setPromptCategory] = useState('General');
    const [loading, setLoading] = useState(isEdit);
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState({
        characterCount: 0,
        wordCount: 0,
        lineCount: 0,
        variables: []
    });
    useEffect(() => {
        if (isEdit && id) {
            fetchPrompt();
        }
    }, [isEdit, id]);
    useEffect(() => {
        calculateStats(promptText);
    }, [promptText]);
    const fetchPrompt = async () => {
        if (!id)
            return;
        try {
            const { data, error } = await supabase
                .from('prompts')
                .select('*')
                .eq('content_item_id', id)
                .maybeSingle();
            if (error)
                throw error;
            if (data) {
                setPrompt(data);
                setPromptText(data.prompt_text || '');
                setPromptCategory(data.prompt_category || 'General');
            }
        }
        catch (error) {
            console.error('Error fetching prompt:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const calculateStats = (text) => {
        const characterCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lineCount = text.split('\n').length;
        // Extract variables (text within curly braces or square brackets)
        const variableMatches = text.match(/\{([^}]+)\}|\[([^\]]+)\]/g) || [];
        const variables = [...new Set(variableMatches.map(match => match.replace(/[{}\[\]]/g, '')))];
        setStats({
            characterCount,
            wordCount,
            lineCount,
            variables
        });
    };
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(promptText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            // Update usage count
            if (prompt) {
                await supabase
                    .from('prompts')
                    .update({
                    usage_count: (prompt.usage_count || 0) + 1,
                    last_copied_at: new Date().toISOString()
                })
                    .eq('id', prompt.id);
                setPrompt(prev => prev ? {
                    ...prev,
                    usage_count: (prev.usage_count || 0) + 1,
                    last_copied_at: new Date().toISOString()
                } : null);
            }
        }
        catch (error) {
            console.error('Failed to copy prompt:', error);
        }
    };
    const insertVariable = (variable) => {
        const textarea = document.getElementById('promptText');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newText = promptText.substring(0, start) + `{${variable}}` + promptText.substring(end);
            setPromptText(newText);
            // Move cursor after the inserted variable
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
            }, 0);
        }
    };
    const savePromptData = async (contentItemId) => {
        try {
            const promptData = {
                content_item_id: contentItemId,
                prompt_text: promptText,
                prompt_category: promptCategory,
                usage_count: prompt?.usage_count || 0,
                last_copied_at: prompt?.last_copied_at || null
            };
            if (prompt) {
                const { error } = await supabase
                    .from('prompts')
                    .update({ ...promptData, updated_at: new Date().toISOString() })
                    .eq('id', prompt.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase
                    .from('prompts')
                    .insert([promptData]);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            console.error('Error saving prompt data:', error);
            throw error;
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading prompt..." })] }) }));
    }
    return (_jsx(ContentEditor, { contentType: "prompt", isEdit: isEdit, onSaveContent: savePromptData, title: "Prompts", description: "Reusable prompt templates", color: "#8B5CF6", icon: MessageSquare, children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(BarChart3, { className: "h-5 w-5 mr-2 text-purple-500" }), "Prompt Statistics"] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "text-center p-3 bg-blue-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: stats.characterCount.toLocaleString() }), _jsx("div", { className: "text-xs text-blue-600 uppercase tracking-wide font-medium", children: "Characters" })] }), _jsxs("div", { className: "text-center p-3 bg-green-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: stats.wordCount.toLocaleString() }), _jsx("div", { className: "text-xs text-green-600 uppercase tracking-wide font-medium", children: "Words" })] }), _jsxs("div", { className: "text-center p-3 bg-purple-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: stats.lineCount }), _jsx("div", { className: "text-xs text-purple-600 uppercase tracking-wide font-medium", children: "Lines" })] }), _jsxs("div", { className: "text-center p-3 bg-orange-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: stats.variables.length }), _jsx("div", { className: "text-xs text-orange-600 uppercase tracking-wide font-medium", children: "Variables" })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Tag, { className: "h-5 w-5 mr-2 text-purple-500" }), "Category & Classification"] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700 mb-2", children: "Prompt Category" }), _jsx("select", { id: "category", value: promptCategory, onChange: (e) => setPromptCategory(e.target.value), className: "w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500", children: PROMPT_CATEGORIES.map((category) => (_jsx("option", { value: category, children: category }, category))) }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Categorize your prompt to make it easier to find and organize" })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(MessageSquare, { className: "h-5 w-5 mr-2 text-purple-500" }), "Prompt Content"] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: copyToClipboard, disabled: !promptText.trim(), className: `inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${copied
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'} disabled:opacity-50`, children: copied ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-1" }), "Copied!"] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: "h-4 w-4 mr-1" }), "Copy"] })) }), _jsxs("div", { className: "text-sm text-gray-500", children: [stats.characterCount, " / ", stats.wordCount, " words"] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("textarea", { id: "promptText", value: promptText, onChange: (e) => setPromptText(e.target.value), rows: 12, className: "w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm leading-relaxed", placeholder: "Enter your prompt template here...\\n\\nYou can use variables like {name}, {topic}, or [variable] to make your prompts reusable.\\n\\nExample:\\nYou are a helpful AI assistant specialized in {field}. Please help me with {task} by providing {output_format} that is {tone} and {length}." }), stats.variables.length > 0 && (_jsxs("div", { className: "p-4 bg-purple-50 rounded-lg", children: [_jsxs("h4", { className: "text-sm font-medium text-purple-900 mb-2 flex items-center", children: [_jsx(Hash, { className: "h-4 w-4 mr-1" }), "Detected Variables (", stats.variables.length, ")"] }), _jsx("div", { className: "flex flex-wrap gap-2", children: stats.variables.map((variable, index) => (_jsxs("span", { className: "inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md font-mono", children: [_jsx(Hash, { className: "h-3 w-3 mr-1" }), variable] }, index))) }), _jsx("p", { className: "text-xs text-purple-700 mt-2", children: "These variables can be replaced when using the prompt" })] })), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Quick Variables" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ['name', 'topic', 'context', 'tone', 'format', 'length', 'audience', 'goal'].map((variable) => (_jsxs("button", { onClick: () => insertVariable(variable), className: "inline-flex items-center px-2 py-1 bg-white border border-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-100 transition-colors", children: ["+ ", variable] }, variable))) }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Click to insert common variables into your prompt" })] }), _jsx("div", { className: "p-4 bg-purple-50 rounded-lg", children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx(MessageSquare, { className: "h-4 w-4 text-purple-600 mt-0.5" }), _jsxs("div", { className: "text-sm text-purple-700", children: [_jsx("p", { className: "font-medium mb-1", children: "Prompt Template Tips" }), _jsxs("ul", { className: "text-xs space-y-1 list-disc list-inside", children: [_jsxs("li", { children: ["Use ", '{variable}', " or [variable] syntax for replaceable parts"] }), _jsx("li", { children: "Be specific about the desired output format and style" }), _jsx("li", { children: "Include context and constraints to guide the AI response" }), _jsx("li", { children: "Test your prompts with different variables to ensure consistency" })] })] })] }) })] })] }), prompt && (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Clock, { className: "h-5 w-5 mr-2 text-blue-500" }), "Usage Statistics"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: prompt.usage_count || 0 }), _jsx("div", { className: "text-sm text-blue-600", children: "Times Copied" })] }), _jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [_jsx("div", { className: "text-sm font-medium text-green-600", children: prompt.last_copied_at
                                                ? new Date(prompt.last_copied_at).toLocaleDateString()
                                                : 'Never' }), _jsx("div", { className: "text-sm text-green-600", children: "Last Copied" })] })] })] })), promptText.trim() && (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Prompt Preview" }), _jsx("div", { className: "p-4 bg-gray-50 rounded-lg border", children: _jsx("pre", { className: "whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed", children: promptText }) }), _jsxs("div", { className: "mt-3 flex items-center justify-between text-sm text-gray-600", children: [_jsx("span", { children: "This is how your prompt will appear when copied" }), _jsxs("button", { onClick: copyToClipboard, className: "inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors", children: [_jsx(Copy, { className: "h-3 w-3 mr-1" }), "Copy Preview"] })] })] }))] }) }));
}
export default PromptEditor;
