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
    const method = req.method;

    if (method === 'GET') {
      // GET requests don't require authentication - use anon key
      const publicClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      // Get courses
      const { data, error } = await publicClient
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (method === 'POST') {
      // Create course
      const requestData = await req.json();
      const { title, description, status, thumbnail_url, tags, created_by } = requestData;

      const { data, error } = await supabaseClient
        .from('courses')
        .insert({
          title: title || 'Untitled Course',
          description: description || '',
          status: status || 'draft',
          thumbnail_url: thumbnail_url || '',
          tags: tags || [],
          created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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

    if (method === 'PUT') {
      // Update course
      const courseId = url.searchParams.get('id');
      const requestData = await req.json();

      if (!courseId) {
        throw new Error('Course ID is required for update');
      }

      const { data, error } = await supabaseClient
        .from('courses')
        .update({
          ...requestData,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (method === 'DELETE') {
      // Delete course
      const courseId = url.searchParams.get('id');

      if (!courseId) {
        throw new Error('Course ID is required for deletion');
      }

      const { error } = await supabaseClient
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ message: 'Course deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Courses API Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});