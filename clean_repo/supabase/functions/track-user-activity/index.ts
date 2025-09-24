import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface ActivityRequest {
  userId: string
  clientId: string
  activityType: string
  activityData?: any
  contentItemId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, clientId, activityType, activityData, contentItemId }: ActivityRequest = await req.json()
    
    // Record user activity
    const { data: activity, error: activityError } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        client_id: clientId,
        activity_type: activityType,
        activity_data: activityData || null,
        content_item_id: contentItemId || null
      })
      .select()
      .single()

    if (activityError) throw activityError

    // Update user's last_active timestamp
    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId)

    // If this is content engagement, also record it in content_engagements table
    if (contentItemId && ['view', 'practice', 'complete', 'favorite'].includes(activityType)) {
      await supabase
        .from('content_engagements')
        .upsert({
          content_item_id: contentItemId,
          user_id: userId,
          client_id: clientId,
          engagement_type: activityType,
          engagement_data: activityData || null
        }, {
          onConflict: 'content_item_id,user_id,engagement_type'
        })
    }

    // If this is an agent conversation, record it separately
    if (activityType === 'agent_chat' && contentItemId && activityData?.conversation) {
      const conversationData = activityData.conversation
      const messageCount = conversationData.messages ? conversationData.messages.length : 0
      
      await supabase
        .from('agent_conversations')
        .insert({
          agent_id: contentItemId,
          user_id: userId,
          client_id: clientId,
          conversation_data: conversationData,
          message_count: messageCount,
          last_message_at: new Date().toISOString()
        })
    }

    return new Response(JSON.stringify({ success: true, activity }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Activity Tracking Error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'ACTIVITY_TRACKING_ERROR',
        message: error.message || 'Failed to track user activity'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})