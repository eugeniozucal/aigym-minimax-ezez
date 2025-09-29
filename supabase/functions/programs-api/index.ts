Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    const method = req.method;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const programId = pathParts[pathParts.length - 1];

    switch (method) {
      case 'GET':
      case 'POST':
        if (programId && programId !== 'programs-api') {
          // Get specific program
          const selectFields = `
            *,
            program_communities(
              community_id,
              assigned_at,
              communities(
                id,
                name,
                brand_color,
                logo_url
              )
            )
          `;
          
          const response = await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${programId}&select=${selectFields}`, {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch program');
          }
          
          const programs = await response.json();
          if (programs.length === 0) {
            throw new Error('Program not found');
          }
          
          const program = programs[0];
          
          // Process community assignments
          const communityAssignments = program.program_communities?.map(pc => {
            const community = Array.isArray(pc.communities) ? pc.communities[0] : pc.communities;
            return {
              community_id: pc.community_id,
              community_name: community?.name || 'Unknown',
              assigned_at: pc.assigned_at,
              brand_color: community?.brand_color || '#6B7280',
              logo_url: community?.logo_url
            };
          }) || [];
          
          return new Response(JSON.stringify({ 
            data: {
              ...program,
              communities: communityAssignments
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // List programs - handle both query params and request body
          let limit = 50;
          let offset = 0;
          let includeCommunities = true;
          
          // Try to get parameters from URL query first
          const searchParams = new URLSearchParams(url.search);
          if (searchParams.has('limit')) limit = parseInt(searchParams.get('limit') || '50');
          if (searchParams.has('offset')) offset = parseInt(searchParams.get('offset') || '0');
          if (searchParams.has('include_communities')) includeCommunities = searchParams.get('include_communities') === 'true';
          
          // If no query params, try to get from request body (for invoke calls)
          try {
            const requestBody = await req.json();
            if (requestBody.limit) limit = requestBody.limit;
            if (requestBody.offset) offset = requestBody.offset;
            if (requestBody.include_communities !== undefined) includeCommunities = requestBody.include_communities;
          } catch (e) {
            // No body or invalid JSON, use defaults/query params
          }
          
          let query = `select=*${includeCommunities ? ',program_communities(community_id,assigned_at,communities(id,name,brand_color,logo_url))' : ''}&limit=${limit}&offset=${offset}&order=updated_at.desc`;
          
          const response = await fetch(`${supabaseUrl}/rest/v1/programs?${query}`, {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch programs: ${errorText}`);
          }
          
          let programs = await response.json();
          
          // Process community assignments if included
          if (includeCommunities) {
            programs = programs.map(program => {
              const communityAssignments = program.program_communities?.map(pc => {
                const community = Array.isArray(pc.communities) ? pc.communities[0] : pc.communities;
                return {
                  community_id: pc.community_id,
                  community_name: community?.name || 'Unknown',
                  assigned_at: pc.assigned_at,
                  brand_color: community?.brand_color || '#6B7280',
                  logo_url: community?.logo_url
                };
              }) || [];
              
              return {
                ...program,
                communities: communityAssignments
              };
            });
          }
          
          return new Response(JSON.stringify({ 
            data: programs
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      
      case 'DELETE':
        if (!programId || programId === 'programs-api') {
          throw new Error('Program ID required for deletion');
        }
        
        const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${programId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          throw new Error(`Failed to delete program: ${errorText}`);
        }
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Programs API Error:', error);
    const errorResponse = {
      error: {
        code: 'PROGRAMS_API_ERROR',
        message: error.message || 'Unknown error occurred'
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});