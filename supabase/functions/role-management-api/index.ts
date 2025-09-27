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

        // Get request data
        const { action, userId, role, communityId, assignedBy } = await req.json();

        // Validate required parameters
        if (!action) {
            throw new Error('Action is required');
        }

        switch (action) {
            case 'getUserRole': {
                if (!userId) {
                    throw new Error('User ID is required for getUserRole');
                }

                // Call the database function to get user role with fallbacks
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_user_role`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ p_user_id: userId })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to get user role: ${errorText}`);
                }

                const roleData = await response.json();
                
                return new Response(JSON.stringify({
                    data: {
                        userId,
                        role: roleData[0]?.role || 'community_user',
                        communityId: roleData[0]?.community_id || null
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'assignRole': {
                if (!userId || !role) {
                    throw new Error('User ID and role are required for assignRole');
                }

                // Call the database function to assign role
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/assign_user_role`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_user_id: userId,
                        p_role: role,
                        p_community_id: communityId || null,
                        p_assigned_by: assignedBy || null
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to assign role: ${errorText}`);
                }

                const roleId = await response.json();

                // Log the role assignment event
                await fetch(`${supabaseUrl}/rest/v1/rpc/log_auth_event`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_user_id: userId,
                        p_event_type: 'role_assigned',
                        p_event_data: { role, communityId, assignedBy },
                        p_success: true
                    })
                });

                return new Response(JSON.stringify({
                    data: {
                        roleId,
                        userId,
                        role,
                        communityId,
                        message: 'Role assigned successfully'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'listUserRoles': {
                // Get all user roles for admin interface
                const response = await fetch(`${supabaseUrl}/rest/v1/user_roles?select=*&is_active=eq.true&order=assigned_at.desc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to list user roles: ${errorText}`);
                }

                const roles = await response.json();

                // Fetch user emails separately for each role
                const rolesWithUsers = await Promise.all(roles.map(async (role: any) => {
                    const userResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${role.user_id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });
                    
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        return { ...role, user_email: userData.email };
                    }
                    return { ...role, user_email: 'Unknown' };
                }));

                return new Response(JSON.stringify({
                    data: rolesWithUsers
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'getAuthAuditLog': {
                // Get authentication audit log for admin
                const limit = 100; // Limit to recent events
                const response = await fetch(`${supabaseUrl}/rest/v1/auth_audit_log?select=*&order=created_at.desc&limit=${limit}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to get audit log: ${errorText}`);
                }

                const auditLog = await response.json();

                return new Response(JSON.stringify({
                    data: auditLog
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Role management error:', error);

        const errorResponse = {
            error: {
                code: 'ROLE_MANAGEMENT_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});