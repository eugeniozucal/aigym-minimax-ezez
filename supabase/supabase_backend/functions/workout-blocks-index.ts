import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const method = req.method

    // GET - Fetch workout blocks with optional filtering
    if (method === 'GET') {
      let query = supabase
        .from('workout_blocks')
        .select('*')
        .order('updated_at', { ascending: false })

      // Apply filters from query parameters
      const search = url.searchParams.get('search')
      const status = url.searchParams.get('status')
      const difficulty = url.searchParams.get('difficulty')
      const category = url.searchParams.get('category')
      const limit = url.searchParams.get('limit')

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      if (difficulty && difficulty !== 'all') {
        query = query.eq('difficulty_level', difficulty)
      }

      if (category && category !== 'all') {
        query = query.eq('block_category', category)
      }

      if (limit) {
        query = query.limit(parseInt(limit))
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching workout blocks:', error)
        return new Response(
          JSON.stringify({ error: { code: 'FETCH_ERROR', message: error.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Create new workout block
    if (method === 'POST') {
      const requestData = await req.json()
      const {
        title,
        description,
        thumbnail_url,
        status = 'draft',
        estimated_duration_minutes = 0,
        difficulty_level = 'beginner',
        tags = [],
        block_category = 'general',
        equipment_needed = [],
        instructions,
        created_by
      } = requestData

      if (!title) {
        return new Response(
          JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Title is required' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('workout_blocks')
        .insert({
          title,
          description,
          thumbnail_url,
          status,
          estimated_duration_minutes,
          difficulty_level,
          tags,
          block_category,
          equipment_needed,
          instructions,
          created_by
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating workout block:', error)
        return new Response(
          JSON.stringify({ error: { code: 'CREATE_ERROR', message: error.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT - Update existing workout block
    if (method === 'PUT') {
      const requestData = await req.json()
      const { id, ...updateData } = requestData

      if (!id) {
        return new Response(
          JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'ID is required for updates' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('workout_blocks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating workout block:', error)
        return new Response(
          JSON.stringify({ error: { code: 'UPDATE_ERROR', message: error.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Remove workout block
    if (method === 'DELETE') {
      const requestData = await req.json()
      const { id } = requestData

      if (!id) {
        return new Response(
          JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'ID is required for deletion' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('workout_blocks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting workout block:', error)
        return new Response(
          JSON.stringify({ error: { code: 'DELETE_ERROR', message: error.message } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Workout block deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${method} not allowed` } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})