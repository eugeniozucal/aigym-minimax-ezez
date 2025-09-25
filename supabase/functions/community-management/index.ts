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
        const { action, community_id, community_data } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authentication required');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid authentication token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Verify user is admin
        const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=is_admin`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!profileResponse.ok) {
            throw new Error('Unable to verify admin status');
        }

        const profiles = await profileResponse.json();
        const isAdmin = profiles.length > 0 && profiles[0].is_admin;

        if (!isAdmin) {
            throw new Error('Admin privileges required');
        }

        if (action === 'create') {
            // Create new community
            const response = await fetch(`${supabaseUrl}/rest/v1/communities`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    name: community_data.name,
                    project_name: community_data.project_name || null,
                    logo_url: community_data.logo_url || null,
                    brand_color: community_data.brand_color || '#3B82F6',
                    forum_enabled: community_data.forum_enabled !== false,
                    status: 'active',
                    is_template: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create community: ${errorText}`);
            }

            const newCommunity = await response.json();
            
            return new Response(JSON.stringify({
                data: newCommunity[0]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'update') {
            // Update existing community
            if (!community_id) {
                throw new Error('Community ID is required for update');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/communities?id=eq.${community_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    name: community_data.name,
                    project_name: community_data.project_name || null,
                    logo_url: community_data.logo_url || null,
                    brand_color: community_data.brand_color || '#3B82F6',
                    forum_enabled: community_data.forum_enabled !== false,
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update community: ${errorText}`);
            }

            const updatedCommunity = await response.json();
            
            return new Response(JSON.stringify({
                data: updatedCommunity[0]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'delete') {
            // Delete community
            if (!community_id) {
                throw new Error('Community ID is required for deletion');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/communities?id=eq.${community_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete community: ${errorText}`);
            }
            
            return new Response(JSON.stringify({
                data: { success: true, message: 'Community deleted successfully' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('Community management error:', error);

        const errorResponse = {
            error: {
                code: 'COMMUNITY_MANAGEMENT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});