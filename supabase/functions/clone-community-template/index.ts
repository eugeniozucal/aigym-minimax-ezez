import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-community-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { template_id, community_data, include_content } = await req.json();

    if (!template_id || !community_data) {
      throw new Error('Missing required parameters: template_id and community_data');
    }

    // First, create the new community
    const { data: newCommunity, error: communityError } = await supabaseClient
      .from('communities')
      .insert([community_data])
      .select()
      .single();

    if (communityError) {
      throw communityError;
    }

    let clonedData = {
      community: newCommunity,
      cloned_features: 0,
      cloned_content: 0
    };

    // Clone community features
    const { data: templateFeatures } = await supabaseClient
      .from('community_features')
      .select('*')
      .eq('community_id', template_id);

    if (templateFeatures && templateFeatures.length > 0) {
      const featuresToClone = templateFeatures.map(feature => ({
        community_id: newCommunity.id,
        feature_name: feature.feature_name,
        enabled: feature.enabled
      }));

      const { error: featuresError } = await supabaseClient
        .from('community_features')
        .insert(featuresToClone);

      if (!featuresError) {
        clonedData.cloned_features = featuresToClone.length;
      }
    }

    // Clone content if requested
    if (include_content) {
      // Get template's assigned content
      const { data: templateContent } = await supabaseClient
        .from('content_community_assignments')
        .select('content_item_id')
        .eq('community_id', template_id);

      if (templateContent && templateContent.length > 0) {
        const contentToClone = templateContent.map(assignment => ({
          content_item_id: assignment.content_item_id,
          community_id: newCommunity.id,
          assigned_at: new Date().toISOString(),
          assigned_by: 'system' // or get from auth context
        }));

        const { error: contentError } = await supabaseClient
          .from('content_community_assignments')
          .insert(contentToClone);

        if (!contentError) {
          clonedData.cloned_content = contentToClone.length;
        }
      }
    }

    // Log the cloning activity
    await supabaseClient
      .from('user_activity_log')
      .insert({
        user_id: null, // system action
        community_id: newCommunity.id,
        activity_type: 'community_created_from_template',
        activity_data: {
          template_id,
          cloned_features: clonedData.cloned_features,
          cloned_content: clonedData.cloned_content
        }
      });

    return new Response(JSON.stringify({ data: clonedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error cloning template:', error);
    
    const errorResponse = {
      error: {
        code: 'TEMPLATE_CLONE_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});