import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-community-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface CreateTemplateRequest {
  sourceCommunityId: string
  newCommunityName: string
  newProjectName?: string
  includeContent: boolean
  logoUrl?: string
  colorHex?: string
  hasForumToggle?: boolean
  apiKeyId?: string
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

    const { 
      sourceCommunityId, 
      newCommunityName, 
      newProjectName,
      includeContent,
      logoUrl,
      colorHex,
      hasForumToggle,
      apiKeyId
    }: CreateTemplateRequest = await req.json()

    // Get the source community data
    const { data: sourceCommunity, error: sourceError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', sourceCommunityId)
      .single()

    if (sourceError || !sourceCommunity) {
      throw new Error('Source community not found')
    }

    // Create new community
    const { data: newCommunity, error: communityError } = await supabase
      .from('communities')
      .insert({
        name: newCommunityName,
        project_name: newProjectName || sourceCommunity.project_name,
        logo_url: logoUrl || sourceCommunity.logo_url,
        color_hex: colorHex || sourceCommunity.color_hex,
        has_forum: hasForumToggle !== undefined ? hasForumToggle : sourceCommunity.has_forum,
        api_key_id: apiKeyId || sourceCommunity.api_key_id,
        template_source_id: sourceCommunityId,
        status: 'active'
      })
      .select()
      .single()

    if (communityError) throw communityError

    // Copy community features
    const { data: sourceFeatures } = await supabase
      .from('community_features')
      .select('*')
      .eq('community_id', sourceCommunityId)

    if (sourceFeatures && sourceFeatures.length > 0) {
      const newFeatures = sourceFeatures.map(feature => ({
        community_id: newCommunity.id,
        feature_name: feature.feature_name,
        enabled: feature.enabled
      }))

      await supabase
        .from('community_features')
        .insert(newFeatures)
    }

    // Copy user tags
    const { data: sourceTags } = await supabase
      .from('user_tags')
      .select('*')
      .eq('community_id', sourceCommunityId)

    const tagMapping = new Map()
    
    if (sourceTags && sourceTags.length > 0) {
      for (const tag of sourceTags) {
        const { data: newTag, error: tagError } = await supabase
          .from('user_tags')
          .insert({
            community_id: newCommunity.id,
            name: tag.name,
            color: tag.color
          })
          .select()
          .single()

        if (!tagError && newTag) {
          tagMapping.set(tag.id, newTag.id)
        }
      }
    }

    let contentItemMapping = new Map()

    // Copy content if requested
    if (includeContent) {
      // Get content assigned to source community
      const { data: sourceContentAssignments } = await supabase
        .from('content_community_assignments')
        .select(`
          content_item_id,
          content_items!inner(*)
        `)
        .eq('community_id', sourceCommunityId)

      if (sourceContentAssignments && sourceContentAssignments.length > 0) {
        for (const assignment of sourceContentAssignments) {
          const sourceContent = assignment.content_items
          
          // Create new content item
          const { data: newContentItem, error: contentError } = await supabase
            .from('content_items')
            .insert({
              title: `${sourceContent.title} (Copy)`,
              description: sourceContent.description,
              thumbnail_url: sourceContent.thumbnail_url,
              content_type: sourceContent.content_type,
              status: 'draft', // New copies start as drafts
              created_by: sourceContent.created_by
            })
            .select()
            .single()

          if (!contentError && newContentItem) {
            contentItemMapping.set(sourceContent.id, newContentItem.id)
            
            // Assign to new community
            await supabase
              .from('content_community_assignments')
              .insert({
                content_item_id: newContentItem.id,
                community_id: newCommunity.id,
                assigned_by: sourceContent.created_by
              })

            // Copy type-specific content data
            switch (sourceContent.content_type) {
              case 'ai_agent':
                const { data: agentData } = await supabase
                  .from('ai_agents')
                  .select('*')
                  .eq('content_item_id', sourceContent.id)
                  .single()
                
                if (agentData) {
                  await supabase
                    .from('ai_agents')
                    .insert({
                      content_item_id: newContentItem.id,
                      system_prompt: agentData.system_prompt,
                      agent_name: agentData.agent_name,
                      short_description: agentData.short_description
                    })
                }
                break

              case 'document':
                const { data: docData } = await supabase
                  .from('documents')
                  .select('*')
                  .eq('content_item_id', sourceContent.id)
                  .single()
                
                if (docData) {
                  await supabase
                    .from('documents')
                    .insert({
                      content_item_id: newContentItem.id,
                      content_html: docData.content_html,
                      content_json: docData.content_json,
                      word_count: docData.word_count,
                      reading_time_minutes: docData.reading_time_minutes
                    })
                }
                break

              case 'video':
                const { data: videoData } = await supabase
                  .from('videos')
                  .select('*')
                  .eq('content_item_id', sourceContent.id)
                  .single()
                
                if (videoData) {
                  await supabase
                    .from('videos')
                    .insert({
                      content_item_id: newContentItem.id,
                      video_url: videoData.video_url,
                      video_platform: videoData.video_platform,
                      video_id: videoData.video_id,
                      duration_seconds: videoData.duration_seconds,
                      transcription: videoData.transcription,
                      auto_title: videoData.auto_title,
                      auto_description: videoData.auto_description
                    })
                }
                break

              case 'prompt':
                const { data: promptData } = await supabase
                  .from('prompts')
                  .select('*')
                  .eq('content_item_id', sourceContent.id)
                  .single()
                
                if (promptData) {
                  await supabase
                    .from('prompts')
                    .insert({
                      content_item_id: newContentItem.id,
                      prompt_text: promptData.prompt_text,
                      prompt_category: promptData.prompt_category
                    })
                }
                break

              case 'automation':
                const { data: autoData } = await supabase
                  .from('automations')
                  .select('*')
                  .eq('content_item_id', sourceContent.id)
                  .single()
                
                if (autoData) {
                  await supabase
                    .from('automations')
                    .insert({
                      content_item_id: newContentItem.id,
                      automation_url: autoData.automation_url,
                      required_tools: autoData.required_tools,
                      tool_description: autoData.tool_description,
                      setup_instructions: autoData.setup_instructions
                    })
                }
                break
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      newCommunity,
      copiedTags: sourceTags?.length || 0,
      copiedContent: includeContent ? contentItemMapping.size : 0,
      templateSourceId: sourceCommunityId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Template Creation Error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'TEMPLATE_CREATION_ERROR',
        message: error.message || 'Failed to create community template'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})