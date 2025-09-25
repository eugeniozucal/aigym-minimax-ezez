import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CommunitySettingsUpdate {
  communityId: string
  settings: {
    name?: string
    project_name?: string
    color_hex?: string
    logo_url?: string
    status?: string
    has_forum?: boolean
  }
}

interface CommunityFeaturesUpdate {
  communityId: string
  features: Record<string, boolean>
}

interface UserTagAssignment {
  userId: string
  tagIds: string[]
  communityId: string
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-community-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, ...data } = await req.json()

    switch (action) {
      case 'update_community_settings': {
        const { communityId, settings } = data as CommunitySettingsUpdate
        
        const { data: updatedCommunity, error } = await supabase
          .from('communities')
          .update(settings)
          .eq('id', communityId)
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify({ 
          success: true, 
          data: updatedCommunity 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'update_community_features': {
        const { communityId, features } = data as CommunityFeaturesUpdate
        
        // For each feature, update or create a community_features record
        const featureUpdates = Object.entries(features).map(async ([featureName, enabled]) => {
          const { error } = await supabase
            .from('community_features')
            .upsert({
              community_id: communityId,
              feature_name: featureName,
              enabled: enabled
            }, {
              onConflict: 'community_id,feature_name'
            })
          
          if (error) throw error
        })

        await Promise.all(featureUpdates)

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Features updated successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'assign_user_tags': {
        const { userId, tagIds, communityId } = data as UserTagAssignment
        
        // First, remove existing tag assignments for this user
        await supabase
          .from('user_tag_assignments')
          .delete()
          .eq('user_id', userId)

        // Then, add new tag assignments
        if (tagIds.length > 0) {
          const assignments = tagIds.map(tagId => ({
            user_id: userId,
            tag_id: tagId,
            assigned_by: 'admin', // You might want to get this from the auth context
            assigned_at: new Date().toISOString()
          }))

          const { error } = await supabase
            .from('user_tag_assignments')
            .insert(assignments)

          if (error) throw error
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'User tags updated successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_community_analytics': {
        const { communityId } = data
        
        // Get user count
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)

        // Get tag count
        const { count: tagCount } = await supabase
          .from('user_tags')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)

        // Get recent activity count (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { count: recentActivity } = await supabase
          .from('user_activities')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', thirtyDaysAgo.toISOString())

        const analytics = {
          userCount: userCount || 0,
          tagCount: tagCount || 0,
          recentActivity: recentActivity || 0
        }

        return new Response(JSON.stringify({ 
          success: true, 
          data: analytics 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'bulk_update_users': {
        const { communityId, userUpdates } = data
        
        const updates = userUpdates.map(async (update: any) => {
          const { error } = await supabase
            .from('users')
            .update(update.changes)
            .eq('id', update.userId)
            .eq('community_id', communityId)
          
          if (error) throw error
        })

        await Promise.all(updates)

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Users updated successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({
          error: {
            code: 'INVALID_ACTION',
            message: 'Invalid action specified'
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Community management error:', error)
    
    const errorResponse = {
      error: {
        code: 'COMMUNITY_MANAGEMENT_ERROR',
        message: error.message
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
