// Content Management API Edge Function
// Handles bulk operations like copy, move, and delete for WODs and BLOCKS

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

    if (method !== 'POST') {
      return new Response(
        JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method allowed' } }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    const { action, items, repository_type, folder_id } = requestData;
    
    if (!action || !items || !Array.isArray(items) || !repository_type) {
      return new Response(
        JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'action, items array, and repository_type are required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!['wods', 'blocks'].includes(repository_type)) {
      return new Response(
        JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'repository_type must be wods or blocks' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    const tableName = repository_type === 'wods' ? 'wods' : 'workout_blocks';
    
    switch (action) {
      case 'move':
        // Move items to a folder (or root if folder_id is null)
        const moveResults = [];
        
        for (const itemId of items) {
          const updated = await supabaseRequest(`${tableName}?id=eq.${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ folder_id: folder_id || null }),
          });
          moveResults.push(updated[0]);
        }
        
        return new Response(
          JSON.stringify({ 
            data: { 
              success: true, 
              moved_count: moveResults.length,
              items: moveResults 
            } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'copy':
        // Copy items (create duplicates)
        const copyResults = [];
        
        for (const itemId of items) {
          // First, get the original item
          const original = await supabaseRequest(`${tableName}?id=eq.${itemId}`);
          if (original.length === 0) {
            throw new Error(`Item with ID ${itemId} not found`);
          }
          
          const originalItem = original[0];
          
          // Create a copy with modified title and reset some fields
          const copyData = {
            ...originalItem,
            id: undefined, // Let Supabase generate new ID
            title: `${originalItem.title} (Copy)`,
            folder_id: folder_id || null,
            created_at: undefined, // Let Supabase set new timestamp
            updated_at: undefined, // Let Supabase set new timestamp
          };
          
          const copied = await supabaseRequest(tableName, {
            method: 'POST',
            body: JSON.stringify(copyData),
          });
          copyResults.push(copied[0]);
        }
        
        return new Response(
          JSON.stringify({ 
            data: { 
              success: true, 
              copied_count: copyResults.length,
              items: copyResults 
            } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'delete':
        // Delete items
        const deleteResults = [];
        
        for (const itemId of items) {
          await supabaseRequest(`${tableName}?id=eq.${itemId}`, {
            method: 'DELETE',
          });
          deleteResults.push(itemId);
        }
        
        return new Response(
          JSON.stringify({ 
            data: { 
              success: true, 
              deleted_count: deleteResults.length,
              deleted_ids: deleteResults 
            } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'toggle_favorite':
        // Toggle favorite status for items
        const favoriteResults = [];
        
        for (const itemId of items) {
          // Get current item to check favorite status
          const current = await supabaseRequest(`${tableName}?id=eq.${itemId}&select=id,is_favorite`);
          if (current.length === 0) {
            throw new Error(`Item with ID ${itemId} not found`);
          }
          
          const currentItem = current[0];
          const newFavoriteStatus = !currentItem.is_favorite;
          
          const updated = await supabaseRequest(`${tableName}?id=eq.${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_favorite: newFavoriteStatus }),
          });
          favoriteResults.push(updated[0]);
        }
        
        return new Response(
          JSON.stringify({ 
            data: { 
              success: true, 
              updated_count: favoriteResults.length,
              items: favoriteResults 
            } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Invalid action. Supported actions: move, copy, delete, toggle_favorite' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
  } catch (error) {
    console.error('Content Management API Error:', error);
    
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