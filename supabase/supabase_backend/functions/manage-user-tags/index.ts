import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { client_id, action, tag_data } = await req.json();

    if (!client_id || !action) {
      throw new Error('Missing required parameters: client_id and action');
    }

    let result;

    switch (action) {
      case 'create':
        if (!tag_data?.name) {
          throw new Error('Tag name is required for creation');
        }
        
        result = await supabaseClient
          .from('user_tags')
          .insert({
            client_id,
            name: tag_data.name,
            color: tag_data.color || generateTagColor()
          })
          .select()
          .single();
        break;

      case 'update':
        if (!tag_data?.id || !tag_data?.name) {
          throw new Error('Tag ID and name are required for update');
        }
        
        result = await supabaseClient
          .from('user_tags')
          .update({
            name: tag_data.name,
            color: tag_data.color
          })
          .eq('id', tag_data.id)
          .eq('client_id', client_id)
          .select()
          .single();
        break;

      case 'delete':
        if (!tag_data?.id) {
          throw new Error('Tag ID is required for deletion');
        }

        // Check if tag is assigned to any users
        const { data: assignments } = await supabaseClient
          .from('user_tag_assignments')
          .select('id')
          .eq('tag_id', tag_data.id);

        if (assignments && assignments.length > 0) {
          // Remove all assignments first
          await supabaseClient
            .from('user_tag_assignments')
            .delete()
            .eq('tag_id', tag_data.id);
        }

        result = await supabaseClient
          .from('user_tags')
          .delete()
          .eq('id', tag_data.id)
          .eq('client_id', client_id);
        break;

      case 'list':
        result = await supabaseClient
          .from('user_tags')
          .select(`
            *,
            user_count:user_tag_assignments(count)
          `)
          .eq('client_id', client_id)
          .order('created_at', { ascending: false });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (result.error) {
      throw result.error;
    }

    return new Response(JSON.stringify({ data: result.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error managing user tags:', error);
    
    const errorResponse = {
      error: {
        code: 'TAG_MANAGEMENT_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateTagColor(): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}