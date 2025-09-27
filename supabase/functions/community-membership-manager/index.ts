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
        const { action, user_id, community_id, user_ids, role, invited_by } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get requesting user from auth header
        let requestingUserId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    requestingUserId = userData.id;
                }
            } catch (error) {
                console.log('Could not get requesting user:', error.message);
            }
        }

        if (action === 'add_user_to_community') {
            // Add single user to community
            if (!user_id || !community_id) {
                throw new Error('User ID and Community ID are required');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/add_user_to_community`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_user_id: user_id,
                    p_community_id: community_id,
                    p_role: role || 'member',
                    p_invited_by: invited_by || requestingUserId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to add user to community: ${errorText}`);
            }

            const membershipId = await response.json();
            
            return new Response(JSON.stringify({
                data: {
                    membership_id: membershipId,
                    message: 'User successfully added to community'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'bulk_add_users_to_community') {
            // Add multiple users to community
            if (!user_ids || !Array.isArray(user_ids) || !community_id) {
                throw new Error('User IDs array and Community ID are required');
            }

            const results = [];
            const errors = [];

            for (const userId of user_ids) {
                try {
                    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/add_user_to_community`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            p_user_id: userId,
                            p_community_id: community_id,
                            p_role: role || 'member',
                            p_invited_by: invited_by || requestingUserId
                        })
                    });

                    if (response.ok) {
                        const membershipId = await response.json();
                        results.push({ user_id: userId, membership_id: membershipId, success: true });
                    } else {
                        const errorText = await response.text();
                        errors.push({ user_id: userId, error: errorText });
                    }
                } catch (error) {
                    errors.push({ user_id: userId, error: error.message });
                }
            }

            return new Response(JSON.stringify({
                data: {
                    successful: results.length,
                    failed: errors.length,
                    results: results,
                    errors: errors,
                    message: `Processed ${user_ids.length} users: ${results.length} successful, ${errors.length} failed`
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'remove_user_from_community') {
            // Remove user from community
            if (!user_id || !community_id) {
                throw new Error('User ID and Community ID are required');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/remove_user_from_community`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_user_id: user_id,
                    p_community_id: community_id
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to remove user from community: ${errorText}`);
            }

            const success = await response.json();
            
            return new Response(JSON.stringify({
                data: {
                    success: success,
                    message: success ? 'User successfully removed from community' : 'User was not a member of this community'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'get_community_members') {
            // Get all members of a community
            if (!community_id) {
                throw new Error('Community ID is required');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_community_members`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_community_id: community_id
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get community members: ${errorText}`);
            }

            const members = await response.json();
            
            return new Response(JSON.stringify({
                data: {
                    members: members,
                    count: members.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'get_user_communities') {
            // Get all communities for a user
            const targetUserId = user_id || requestingUserId;
            if (!targetUserId) {
                throw new Error('User ID is required');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_user_communities`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_user_id: targetUserId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get user communities: ${errorText}`);
            }

            const communities = await response.json();
            
            return new Response(JSON.stringify({
                data: {
                    communities: communities,
                    count: communities.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'update_member_role') {
            // Update a member's role in a community
            if (!user_id || !community_id || !role) {
                throw new Error('User ID, Community ID, and Role are required');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/user_communities`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: role,
                    updated_at: new Date().toISOString()
                })
            });

            const updateQuery = `user_id=eq.${user_id}&community_id=eq.${community_id}`;
            const updateUrl = `${supabaseUrl}/rest/v1/user_communities?${updateQuery}`;
            
            const updateResponse = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: role,
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update member role: ${errorText}`);
            }
            
            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: `Member role updated to ${role}`
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('Community membership management error:', error);

        const errorResponse = {
            error: {
                code: 'COMMUNITY_MEMBERSHIP_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});