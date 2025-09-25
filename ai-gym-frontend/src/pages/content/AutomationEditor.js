import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ContentEditor } from '@/components/content/ContentEditor';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Zap, Globe, Wrench, Plus, X, ExternalLink, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
const COMMON_TOOLS = [
    'Zapier',
    'Make (Integromat)',
    'Microsoft Power Automate',
    'IFTTT',
    'n8n',
    'Bubble',
    'Airtable',
    'Google Sheets',
    'Slack',
    'Discord',
    'Trello',
    'Asana',
    'Notion',
    'Monday.com',
    'HubSpot',
    'Salesforce',
    'Gmail',
    'Outlook',
    'Google Drive',
    'Dropbox',
    'AWS Lambda',
    'GitHub Actions',
    'Custom API',
    'Other'
];
export function AutomationEditor() {
    const { id } = useParams();
    const isEdit = !!id;
    const [automation, setAutomation] = useState(null);
    const [automationUrl, setAutomationUrl] = useState('');
    const [requiredTools, setRequiredTools] = useState([]);
    const [toolDescription, setToolDescription] = useState('');
    const [setupInstructions, setSetupInstructions] = useState('');
    const [newTool, setNewTool] = useState('');
    const [loading, setLoading] = useState(isEdit);
    const [urlValidating, setUrlValidating] = useState(false);
    const [urlValidation, setUrlValidation] = useState(null);
    useEffect(() => {
        if (isEdit && id) {
            fetchAutomation();
        }
    }, [isEdit, id]);
    useEffect(() => {
        if (automationUrl.trim()) {
            validateUrl(automationUrl.trim());
        }
        else {
            setUrlValidation(null);
        }
    }, [automationUrl]);
    const fetchAutomation = async () => {
        if (!id)
            return;
        try {
            const { data, error } = await supabase
                .from('automations')
                .select('*')
                .eq('content_item_id', id)
                .maybeSingle();
            if (error)
                throw error;
            if (data) {
                setAutomation(data);
                setAutomationUrl(data.automation_url || '');
                setRequiredTools(data.required_tools || []);
                setToolDescription(data.tool_description || '');
                setSetupInstructions(data.setup_instructions || '');
            }
        }
        catch (error) {
            console.error('Error fetching automation:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const validateUrl = async (url) => {
        setUrlValidating(true);
        try {
            // Basic URL format validation
            const urlObj = new URL(url);
            let platform = 'Unknown';
            // Detect automation platforms
            if (urlObj.hostname.includes('zapier.com')) {
                platform = 'Zapier';
            }
            else if (urlObj.hostname.includes('make.com') || urlObj.hostname.includes('integromat.com')) {
                platform = 'Make (Integromat)';
            }
            else if (urlObj.hostname.includes('flow.microsoft.com')) {
                platform = 'Microsoft Power Automate';
            }
            else if (urlObj.hostname.includes('ifttt.com')) {
                platform = 'IFTTT';
            }
            else if (urlObj.hostname.includes('n8n.io')) {
                platform = 'n8n';
            }
            else if (urlObj.hostname.includes('bubble.io')) {
                platform = 'Bubble';
            }
            setUrlValidation({
                isValid: true,
                isReachable: true, // We assume it's reachable since we can't make cross-origin requests
                platform,
                title: `${platform} Automation`,
                description: `Automation workflow hosted on ${platform}`
            });
        }
        catch (error) {
            setUrlValidation({
                isValid: false,
                isReachable: false
            });
        }
        finally {
            setUrlValidating(false);
        }
    };
    const addTool = (tool) => {
        const trimmedTool = tool.trim();
        if (trimmedTool && !requiredTools.includes(trimmedTool)) {
            setRequiredTools([...requiredTools, trimmedTool]);
        }
        setNewTool('');
    };
    const removeTool = (toolToRemove) => {
        setRequiredTools(requiredTools.filter(tool => tool !== toolToRemove));
    };
    const addCommonTool = (tool) => {
        if (!requiredTools.includes(tool)) {
            setRequiredTools([...requiredTools, tool]);
        }
    };
    const saveAutomationData = async (contentItemId) => {
        try {
            const automationData = {
                content_item_id: contentItemId,
                automation_url: automationUrl.trim(),
                required_tools: requiredTools,
                tool_description: toolDescription.trim() || null,
                setup_instructions: setupInstructions.trim() || null
            };
            if (automation) {
                const { error } = await supabase
                    .from('automations')
                    .update({ ...automationData, updated_at: new Date().toISOString() })
                    .eq('id', automation.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase
                    .from('automations')
                    .insert([automationData]);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            console.error('Error saving automation data:', error);
            throw error;
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading automation..." })] }) }));
    }
    return (_jsx(ContentEditor, { contentType: "automation", isEdit: isEdit, onSaveContent: saveAutomationData, title: "Automations", description: "Process automations and workflows", color: "#F59E0B", icon: Zap, children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Globe, { className: "h-5 w-5 mr-2 text-orange-500" }), "Automation Link"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "automationUrl", className: "block text-sm font-medium text-gray-700 mb-2", children: "Automation URL *" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "url", id: "automationUrl", value: automationUrl, onChange: (e) => setAutomationUrl(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500", placeholder: "https://zapier.com/shared/... or https://make.com/template/...", required: true }), urlValidating && (_jsx("div", { className: "absolute right-3 top-1/2 transform -translate-y-1/2", children: _jsx(LoadingSpinner, { size: "sm" }) }))] }), urlValidation && (_jsxs("div", { className: `mt-2 p-3 rounded-lg border ${urlValidation.isValid
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-red-50 border-red-200'}`, children: [_jsxs("div", { className: "flex items-center space-x-2", children: [urlValidation.isValid ? (_jsx(CheckCircle, { className: "h-4 w-4 text-green-600" })) : (_jsx(AlertCircle, { className: "h-4 w-4 text-red-600" })), _jsx("p", { className: `text-sm font-medium ${urlValidation.isValid ? 'text-green-700' : 'text-red-700'}`, children: urlValidation.isValid
                                                                ? `Valid ${urlValidation.platform} automation URL`
                                                                : 'Invalid URL format' })] }), urlValidation.isValid && urlValidation.platform && (_jsxs("div", { className: "mt-1 text-xs text-gray-600", children: ["Platform: ", _jsx("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: urlValidation.platform })] }))] })), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Link to the automation template, workflow, or shared automation" })] }), automationUrl.trim() && urlValidation?.isValid && (_jsxs("div", { className: "p-4 bg-orange-50 rounded-lg border border-orange-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h4", { className: "font-medium text-orange-900", children: "Automation Preview" }), _jsxs("a", { href: automationUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center text-sm text-orange-600 hover:text-orange-800", children: [_jsx(ExternalLink, { className: "h-4 w-4 mr-1" }), "Open in New Tab"] })] }), _jsxs("div", { className: "text-sm text-orange-800", children: [_jsxs("p", { children: [_jsx("strong", { children: "URL:" }), " ", _jsx("span", { className: "font-mono text-xs break-all", children: automationUrl })] }), _jsxs("p", { children: [_jsx("strong", { children: "Platform:" }), " ", urlValidation.platform] })] })] }))] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Wrench, { className: "h-5 w-5 mr-2 text-orange-500" }), "Required Tools & Services"] }), _jsxs("div", { className: "space-y-4", children: [requiredTools.length > 0 && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Selected Tools (", requiredTools.length, ")"] }), _jsx("div", { className: "flex flex-wrap gap-2", children: requiredTools.map((tool, index) => (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 border border-orange-200", children: [tool, _jsx("button", { onClick: () => removeTool(tool), className: "ml-2 text-orange-600 hover:text-orange-800", children: _jsx(X, { className: "h-3 w-3" }) })] }, index))) })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Add Custom Tool" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", value: newTool, onChange: (e) => setNewTool(e.target.value), onKeyPress: (e) => e.key === 'Enter' && addTool(newTool), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500", placeholder: "Enter tool or service name..." }), _jsxs("button", { onClick: () => addTool(newTool), disabled: !newTool.trim() || requiredTools.includes(newTool.trim()), className: "inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50", children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), "Add"] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Quick Add - Common Tools" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2", children: COMMON_TOOLS.map((tool) => (_jsxs("button", { onClick: () => addCommonTool(tool), disabled: requiredTools.includes(tool), className: `px-3 py-2 text-sm border rounded-lg transition-colors ${requiredTools.includes(tool)
                                                    ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`, children: [requiredTools.includes(tool) ? (_jsx(CheckCircle, { className: "h-3 w-3 inline mr-1" })) : (_jsx(Plus, { className: "h-3 w-3 inline mr-1" })), tool] }, tool))) })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(BookOpen, { className: "h-5 w-5 mr-2 text-blue-500" }), "Tools Description"] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "toolDescription", className: "block text-sm font-medium text-gray-700 mb-2", children: "Description of Required Tools" }), _jsx("textarea", { id: "toolDescription", rows: 4, value: toolDescription, onChange: (e) => setToolDescription(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Explain what each tool is used for in this automation...\\n\\nExample:\\n- Zapier: Connects different apps and triggers actions\\n- Google Sheets: Stores and manages data\\n- Slack: Sends notifications to the team" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Help users understand what each tool does in the automation workflow" })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Zap, { className: "h-5 w-5 mr-2 text-orange-500" }), "Setup Instructions"] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "setupInstructions", className: "block text-sm font-medium text-gray-700 mb-2", children: "Step-by-Step Setup Guide" }), _jsx("textarea", { id: "setupInstructions", rows: 8, value: setupInstructions, onChange: (e) => setSetupInstructions(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm", placeholder: "Provide detailed setup instructions...\\n\\nExample:\\n1. Click the automation link above\\n2. Sign up for a Zapier account if you don't have one\\n3. Connect your Google Sheets and Slack accounts\\n4. Configure the trigger conditions\\n5. Test the automation\\n6. Turn on the automation\\n\\nTroubleshooting:\\n- If connection fails, check API permissions\\n- Make sure all required fields are filled" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Provide clear, step-by-step instructions for setting up this automation" })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Automation Summary" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-700 mb-2", children: "Configuration" }), _jsxs("div", { className: "space-y-1 text-sm text-gray-600", children: [_jsxs("p", { children: [_jsx("strong", { children: "URL:" }), " ", automationUrl ? 'Configured' : 'Not set'] }), _jsxs("p", { children: [_jsx("strong", { children: "Required Tools:" }), " ", requiredTools.length, " tool", requiredTools.length !== 1 ? 's' : ''] }), _jsxs("p", { children: [_jsx("strong", { children: "Instructions:" }), " ", setupInstructions.trim() ? 'Provided' : 'None'] }), _jsxs("p", { children: [_jsx("strong", { children: "Tool Description:" }), " ", toolDescription.trim() ? 'Provided' : 'None'] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-700 mb-2", children: "Tools Required" }), _jsx("div", { className: "space-y-1", children: requiredTools.length > 0 ? (_jsx("ul", { className: "text-sm text-gray-600 space-y-0.5", children: requiredTools.map((tool, index) => (_jsxs("li", { className: "flex items-center", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-orange-400 rounded-full mr-2" }), tool] }, index))) })) : (_jsx("p", { className: "text-sm text-gray-500 italic", children: "No tools specified" })) })] })] })] })] }) }));
}
export default AutomationEditor;
