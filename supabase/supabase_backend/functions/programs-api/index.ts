import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface ProgramData {
  id?: string
  title: string
  description?: string
  status: 'draft' | 'published' | 'archived'
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_weeks: number
  program_type: 'strength' | 'cardio' | 'weight-loss' | 'muscle-gain' | 'endurance' | 'flexibility'
  tags: string[]
  sections: any[]
  settings: any
  thumbnail_url?: string
  created_by?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header missing')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const method = req.method

    console.log(`Programs API: ${method} request, ID: ${id}, User: ${user.id}`)

    switch (method) {
      case 'GET': {
        if (id) {
          // Get specific program
          const { data, error } = await supabase
            .from('training_programs')
            .select('*')
            .eq('id', id)
            .single()

          if (error) {
            console.error('Error fetching program:', error)
            throw new Error(`Failed to fetch program: ${error.message}`)
          }

          if (!data) {
            return new Response(
              JSON.stringify({ error: { message: 'Program not found' } }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Get all programs for user
          let query = supabase
            .from('training_programs')
            .select('*')
            .order('updated_at', { ascending: false })

          // For non-admin users, only show their own programs and published programs
          const { data: adminCheck } = await supabase
            .from('admins')
            .select('email')
            .eq('email', user.email)
            .single()

          if (!adminCheck) {
            query = query.or(`created_by.eq.${user.id},status.eq.published`)
          }

          const { data, error } = await query

          if (error) {
            console.error('Error fetching programs:', error)
            throw new Error(`Failed to fetch programs: ${error.message}`)
          }

          return new Response(
            JSON.stringify({ data: data || [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      case 'POST': {
        // Create new program
        const requestData: ProgramData = await req.json()
        
        console.log('Creating program with data:', requestData)

        const programData = {
          title: requestData.title,
          description: requestData.description || '',
          status: requestData.status || 'draft',
          difficulty_level: requestData.difficulty_level || 'beginner',
          estimated_duration_weeks: requestData.estimated_duration_weeks || 8,
          program_type: requestData.program_type || 'strength',
          tags: requestData.tags || [],
          sections: requestData.sections || [],
          settings: requestData.settings || {},
          thumbnail_url: requestData.thumbnail_url || null,
          created_by: user.id
        }

        const { data, error } = await supabase
          .from('training_programs')
          .insert(programData)
          .select()
          .single()

        if (error) {
          console.error('Error creating program:', error)
          throw new Error(`Failed to create program: ${error.message}`)
        }

        console.log('Program created successfully:', data.id)

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PUT': {
        // Update existing program
        if (!id) {
          return new Response(
            JSON.stringify({ error: { message: 'Program ID is required for updates' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const requestData: ProgramData = await req.json()
        
        console.log('Updating program with data:', requestData)

        const programData = {
          title: requestData.title,
          description: requestData.description,
          status: requestData.status,
          difficulty_level: requestData.difficulty_level,
          estimated_duration_weeks: requestData.estimated_duration_weeks,
          program_type: requestData.program_type,
          tags: requestData.tags,
          sections: requestData.sections,
          settings: requestData.settings,
          thumbnail_url: requestData.thumbnail_url
        }

        // Check if user owns the program or is admin
        const { data: existingProgram } = await supabase
          .from('training_programs')
          .select('created_by')
          .eq('id', id)
          .single()

        if (!existingProgram) {
          return new Response(
            JSON.stringify({ error: { message: 'Program not found' } }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: adminCheck } = await supabase
          .from('admins')
          .select('email')
          .eq('email', user.email)
          .single()

        if (existingProgram.created_by !== user.id && !adminCheck) {
          return new Response(
            JSON.stringify({ error: { message: 'Unauthorized to update this program' } }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data, error } = await supabase
          .from('training_programs')
          .update(programData)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          console.error('Error updating program:', error)
          throw new Error(`Failed to update program: ${error.message}`)
        }

        console.log('Program updated successfully:', data.id)

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'DELETE': {
        // Delete program
        if (!id) {
          return new Response(
            JSON.stringify({ error: { message: 'Program ID is required for deletion' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if user owns the program or is admin
        const { data: existingProgram } = await supabase
          .from('training_programs')
          .select('created_by')
          .eq('id', id)
          .single()

        if (!existingProgram) {
          return new Response(
            JSON.stringify({ error: { message: 'Program not found' } }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: adminCheck } = await supabase
          .from('admins')
          .select('email')
          .eq('email', user.email)
          .single()

        if (existingProgram.created_by !== user.id && !adminCheck) {
          return new Response(
            JSON.stringify({ error: { message: 'Unauthorized to delete this program' } }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error } = await supabase
          .from('training_programs')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting program:', error)
          throw new Error(`Failed to delete program: ${error.message}`)
        }

        console.log('Program deleted successfully:', id)

        return new Response(
          JSON.stringify({ message: 'Program deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default: {
        return new Response(
          JSON.stringify({ error: { message: 'Method not allowed' } }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  } catch (error) {
    console.error('Programs API Error:', error)
    
    const errorResponse = {
      error: {
        code: 'PROGRAMS_API_ERROR',
        message: error.message || 'Internal server error'
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})