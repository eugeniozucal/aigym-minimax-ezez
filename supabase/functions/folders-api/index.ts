// Folders API Edge Function
// Handles CRUD operations for the folder system

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
    const url = new URL(req.url);
    const method = req.method;
    
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for POST/PUT/PATCH requests
    let requestData = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      requestData = await req.json();
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Helper function to make Supabase API calls
    const supabaseRequest = async (endpoint: string, options: RequestInit = {}) => {
      const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
        ...options,
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase error: ${response.status} - ${error}`);
      }
      
      return response.json();
    };

    // Route handling
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const folderId = pathSegments[pathSegments.length - 1];
    
    switch (method) {
      case 'GET':
        // GET /folders?repository_type=wods|blocks
        const repositoryType = url.searchParams.get('repository_type');
        
        let foldersQuery = 'folders?order=name.asc';
        if (repositoryType && ['wods', 'blocks'].includes(repositoryType)) {
          foldersQuery += `&repository_type=eq.${repositoryType}`;
        }
        
        const folders = await supabaseRequest(foldersQuery);
        
        return new Response(
          JSON.stringify({ data: folders }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'POST':
        // POST /folders - Create new folder
        const { name, parent_folder_id, repository_type } = requestData;
        
        if (!name || !repository_type) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'name and repository_type are required' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (!['wods', 'blocks'].includes(repository_type)) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'repository_type must be wods or blocks' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const newFolder = await supabaseRequest('folders', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            parent_folder_id: parent_folder_id || null,
            repository_type,
          }),
        });
        
        return new Response(
          JSON.stringify({ data: newFolder[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'PUT':
        // PUT /folders/{id} - Update folder
        if (!folderId) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Folder ID required' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const updateData: any = {};
        if (requestData.name) updateData.name = requestData.name.trim();
        if (requestData.parent_folder_id !== undefined) updateData.parent_folder_id = requestData.parent_folder_id;
        
        const updatedFolder = await supabaseRequest(`folders?id=eq.${folderId}`, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        
        return new Response(
          JSON.stringify({ data: updatedFolder[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'DELETE':
        // DELETE /folders/{id} - Delete folder
        if (!folderId) {
          return new Response(
            JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Folder ID required' } }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // First check if folder has any child folders or items
        const childFolders = await supabaseRequest(`folders?parent_folder_id=eq.${folderId}`);
        if (childFolders.length > 0) {
          return new Response(
            JSON.stringify({ error: { code: 'CONFLICT', message: 'Cannot delete folder with child folders. Move or delete child folders first.' } }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Check for items in this folder
        const wodsInFolder = await supabaseRequest(`wods?folder_id=eq.${folderId}&select=id`);
        const blocksInFolder = await supabaseRequest(`workout_blocks?folder_id=eq.${folderId}&select=id`);
        
        if (wodsInFolder.length > 0 || blocksInFolder.length > 0) {
          return new Response(
            JSON.stringify({ error: { code: 'CONFLICT', message: 'Cannot delete folder containing items. Move or delete items first.' } }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        await supabaseRequest(`folders?id=eq.${folderId}`, {
          method: 'DELETE',
        });
        
        return new Response(
          JSON.stringify({ data: { success: true } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
  } catch (error) {
    console.error('Folders API Error:', error);
    
    const errorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});