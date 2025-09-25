import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ContentEditor } from '@/components/content/ContentEditor'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Editor from '@monaco-editor/react'
import { supabase, AIAgent } from '../../lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Bot, AlertCircle, Copy, RotateCcw, X } from 'lucide-react'

export function AIAgentEditor() {
  const { id } = useParams()
  const isEdit = !!id
  
  const [agent, setAgent] = useState<AIAgent | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [agentName, setAgentName] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    let isMounted = true;
    
    const initializeAgent = async () => {
      if (isEdit && id) {
        try {
          await fetchAgent();
        } catch (error) {
          if (isMounted) {
            console.error('Error initializing AI agent:', error);
            setSaveError(error instanceof Error ? error.message : 'Failed to load AI agent');
          }
        }
      } else {
        setLoading(false);
      }
    };

    initializeAgent();
    
    return () => {
      isMounted = false;
    };
  }, [isEdit, id]);

  const fetchAgent = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    try {
      setSaveError(null);
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('content_item_id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching AI agent:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (data) {
        setAgent(data);
        setSystemPrompt(data.system_prompt || '');
        setAgentName(data.agent_name || '');
        setShortDescription(data.short_description || '');
      }
    } catch (error) {
      console.error('Error fetching AI agent:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to load AI agent');
      throw error; // Re-throw to be handled by caller
    } finally {
      setLoading(false);
    }
  }, [id]);

  const copyPromptToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(systemPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      setSaveError('Failed to copy prompt to clipboard');
    }
  }, [systemPrompt]);

  const resetPrompt = useCallback(() => {
    if (confirm('Are you sure you want to reset the system prompt? This action cannot be undone.')) {
      setSystemPrompt('');
    }
  }, []);

  const saveAgentData = useCallback(async (contentItemId: string) => {
    if (!contentItemId) {
      throw new Error('Content item ID is required for saving agent data');
    }

    // Validate required fields
    if (!agentName.trim()) {
      throw new Error('Agent name is required');
    }

    if (!systemPrompt.trim()) {
      throw new Error('System prompt is required');
    }

    try {
      setSaveError(null);
      
      const agentData = {
        content_item_id: contentItemId,
        system_prompt: systemPrompt.trim(),
        agent_name: agentName.trim(),
        short_description: shortDescription.trim() || null,
        test_conversations: [], // Keep empty array for backward compatibility
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (agent) {
        // Update existing agent with transaction-like behavior
        console.log('Updating existing AI agent:', agent.id);
        
        result = await supabase
          .from('ai_agents')
          .update(agentData)
          .eq('id', agent.id)
          .select()
          .single();
          
        if (result.error) {
          console.error('Update error:', result.error);
          throw new Error(`Failed to update AI agent: ${result.error.message}`);
        }
        
        console.log('AI agent updated successfully:', result.data);
      } else {
        // Create new agent
        console.log('Creating new AI agent for content item:', contentItemId);
        
        result = await supabase
          .from('ai_agents')
          .insert([{ ...agentData, created_at: new Date().toISOString() }])
          .select()
          .single();
          
        if (result.error) {
          console.error('Insert error:', result.error);
          throw new Error(`Failed to create AI agent: ${result.error.message}`);
        }
        
        console.log('AI agent created successfully:', result.data);
        setAgent(result.data);
      }
      
    } catch (error) {
      console.error('Error in saveAgentData:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save agent configuration';
      setSaveError(errorMessage);
      throw error; // Re-throw to prevent ContentEditor from thinking save was successful
    }
  }, [agent, agentName, systemPrompt, shortDescription]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading AI agent...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('AIAgentEditor Error Boundary:', error, errorInfo);
        setSaveError(`Component Error: ${error.message}`);
      }}
    >
      <ContentEditor 
        contentType="ai_agent" 
        isEdit={isEdit}
        onSaveContent={saveAgentData}
        title="AI Agents"
        description="Intelligent AI agents with custom prompts"
        color="#3B82F6"
        icon={Bot}
      >
      <div className="space-y-6">
        {/* Agent Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bot className="h-5 w-5 mr-2 text-blue-500" />
            Agent Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Customer Support Assistant"
                required
              />
            </div>
            
            <div>
              <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
              </label>
              <input
                type="text"
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of agent capabilities"
              />
            </div>
          </div>
        </div>

        {/* System Prompt Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              System Prompt *
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyPromptToClipboard}
                className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  copySuccess 
                    ? 'border-green-300 text-green-700 bg-green-50 focus:ring-green-500'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
                }`}
              >
                <Copy className="h-4 w-4 mr-1" />
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={resetPrompt}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </button>
            </div>
          </div>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Editor
              height="300px"
              language="markdown"
              value={systemPrompt}
              onChange={(value) => setSystemPrompt(value || '')}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontSize: 14,
                lineHeight: 1.6,
                padding: { top: 16, bottom: 16 },
                bracketPairColorization: { enabled: true }
              }}
              theme="vs"
            />
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <p className="flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
              Define how your AI agent should behave, respond, and interact with users. Be specific about tone, knowledge domain, and constraints.
            </p>
          </div>
        </div>

        {/* Usage Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">AI Agent Guidelines</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
              <p>Be specific about the agent's role and expertise area</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
              <p>Define the tone and personality (professional, friendly, technical, etc.)</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
              <p>Set clear boundaries on what the agent can and cannot do</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
              <p>Include examples of good responses for consistency</p>
            </div>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">Error Saving AI Agent</h4>
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </ContentEditor>
    </ErrorBoundary>
  )
}