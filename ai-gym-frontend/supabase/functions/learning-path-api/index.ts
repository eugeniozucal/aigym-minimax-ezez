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

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Extract endpoint from path
    const endpoint = pathSegments[pathSegments.length - 1];

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let user = null;
    if (token) {
      try {
        const { data: { user: authUser } } = await supabaseClient.auth.getUser(token);
        user = authUser;
      } catch (authError) {
        console.log('Auth failed, continuing without user');
      }
    }

    if (endpoint === 'user-learning-path') {
      // Get user learning path - return empty array if no user or no enrollments
      if (!user) {
        return new Response(JSON.stringify({ data: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: enrollments, error } = await supabaseClient
        .from('course_enrollments')
        .select(`
          id,
          enrolled_at,
          status,
          progress,
          course:courses!inner (
            id,
            title,
            description,
            status,
            thumbnail_url
          )
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Learning path query error:', error);
        // Return empty array instead of throwing error
        return new Response(JSON.stringify({ data: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: enrollments || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      // Create learning path entry
      const requestData = await req.json();
      const { course_id, program_id } = requestData;

      const { data, error } = await supabaseClient
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id,
          program_id,
          enrolled_at: new Date().toISOString(),
          status: 'active',
          progress: 0
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      });
    }

    // Default response for other endpoints
    return new Response(JSON.stringify({ data: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Learning Path API Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});