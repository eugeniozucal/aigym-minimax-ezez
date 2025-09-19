import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface ConversationHistoryRequest {
  agentId?: string
  userId?: string
  limit?: number
  offset?: number
}

interface ConversationLoadRequest {
  conversationId: string
  userId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'

    if (action === 'list') {
      // Get conversation list for a user/agent
      const { agentId, userId, limit = 20, offset = 0 }: ConversationHistoryRequest = await req.json()

      if (!userId) {
        return new Response(JSON.stringify({
          error: { code: 'MISSING_USER_ID', message: 'User ID is required' }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      let query = supabase
        .from('conversations')
        .select(`
          id,
          title,
          agent_id,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (agentId) {
        query = query.eq('agent_id', agentId)
      }

      const { data: conversations, error } = await query

      if (error) {
        console.error('Database error:', error)
        throw new Error('Failed to fetch conversations')
      }

      // Enrich conversations with agent data
      const enrichedConversations = []
      for (const conv of conversations || []) {
        const { data: agentData } = await supabase
          .from('ai_agents')
          .select(`
            agent_name,
            content_items!inner (
              title
            )
          `)
          .eq('id', conv.agent_id)
          .single()
        
        enrichedConversations.push({
          ...conv,
          agent_name: agentData?.agent_name,
          content_title: agentData?.content_items?.title
        })
      }

      return new Response(JSON.stringify({
        conversations: enrichedConversations,
        hasMore: enrichedConversations?.length === limit
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'load') {
      // Load specific conversation with messages
      const { conversationId, userId }: ConversationLoadRequest = await req.json()

      if (!conversationId || !userId) {
        return new Response(JSON.stringify({
          error: { code: 'MISSING_PARAMETERS', message: 'Conversation ID and User ID are required' }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // First, verify the conversation belongs to the user
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          agent_id,
          created_at,
          updated_at
        `)
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()

      if (convError || !conversation) {
        return new Response(JSON.stringify({
          error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found or access denied' }
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get agent data separately
      const { data: agentData } = await supabase
        .from('ai_agents')
        .select(`
          agent_name,
          system_prompt,
          content_items!inner (
            title
          )
        `)
        .eq('id', conversation.agent_id)
        .single()
      
      const enrichedConversation = {
        ...conversation,
        agent_name: agentData?.agent_name,
        system_prompt: agentData?.system_prompt,
        content_title: agentData?.content_items?.title
      }

      // Load conversation messages
      const { data: messages, error: msgError } = await supabase
        .from('conversation_messages')
        .select('id, role, content, model_used, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) {
        console.error('Messages fetch error:', msgError)
        throw new Error('Failed to fetch conversation messages')
      }

      return new Response(JSON.stringify({
        conversation: enrichedConversation,
        messages: messages || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'delete') {
      // Delete conversation
      const { conversationId, userId } = await req.json()

      if (!conversationId || !userId) {
        return new Response(JSON.stringify({
          error: { code: 'MISSING_PARAMETERS', message: 'Conversation ID and User ID are required' }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Delete conversation (messages will be deleted via CASCADE)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Delete error:', error)
        throw new Error('Failed to delete conversation')
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Conversation deleted successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      return new Response(JSON.stringify({
        error: { code: 'INVALID_ACTION', message: 'Invalid action specified' }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Conversation History Error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'CONVERSATION_HISTORY_ERROR',
        message: error.message || 'Failed to process conversation history request',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})