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

        // Get authentication header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authorization header required');
        }

        const token = authHeader.replace('Bearer ', '');
        const { action, route, additionalData } = await req.json();

        // Validate the token and get user
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

        switch (action) {
            case 'validateAccess': {
                if (!route) {
                    throw new Error('Route is required for access validation');
                }

                // Get user role from database directly
                const roleResponse = await fetch(`${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&is_active=eq.true&select=role,community_id&order=assigned_at.desc&limit=1`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                let userRole = 'community_user';
                let communityId = null;
                
                if (roleResponse.ok) {
                    const roleData = await roleResponse.json();
                    if (roleData && roleData.length > 0) {
                        userRole = roleData[0].role;
                        communityId = roleData[0].community_id;
                    }
                }

                // Route access validation logic
                let hasAccess = false;
                let redirectTo = null;

                if (route.startsWith('/admin')) {
                    // Admin routes - only admin access
                    hasAccess = userRole === 'admin';
                    if (!hasAccess) {
                        redirectTo = '/user/community';
                    }
                } else if (route.startsWith('/user') || route.startsWith('/community')) {
                    // Community routes - allow community users and admins
                    hasAccess = userRole === 'community_user' || userRole === 'admin';
                    if (!hasAccess) {
                        redirectTo = '/login';
                    }
                } else if (route === '/login') {
                    // Already authenticated - redirect based on role
                    hasAccess = true;
                    if (userRole === 'admin') {
                        redirectTo = '/admin/dashboard';
                    } else {
                        redirectTo = '/user/community';
                    }
                } else if (route === '/') {
                    // Root route - redirect based on role
                    hasAccess = true;
                    if (userRole === 'admin') {
                        redirectTo = '/admin/dashboard';
                    } else {
                        redirectTo = '/user/community';
                    }
                } else {
                    // Default routes - allow authenticated users
                    hasAccess = true;
                }

                // Log access attempt
                await fetch(`${supabaseUrl}/rest/v1/rpc/log_auth_event`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_user_id: userId,
                        p_event_type: 'route_access',
                        p_event_data: { route, userRole, hasAccess, redirectTo },
                        p_success: hasAccess
                    })
                });

                return new Response(JSON.stringify({
                    data: {
                        hasAccess,
                        userRole,
                        communityId,
                        redirectTo,
                        userId
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'getAuthenticatedUser': {
                // Get full user information with role
                const roleResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_user_role`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ p_user_id: userId })
                });

                if (!roleResponse.ok) {
                    throw new Error('Failed to get user role');
                }

                const roleData = await roleResponse.json();
                const userRole = roleData[0]?.role || 'community_user';
                const communityId = roleData[0]?.community_id;

                return new Response(JSON.stringify({
                    data: {
                        id: userId,
                        email: userData.email,
                        role: userRole,
                        communityId,
                        emailConfirmed: userData.email_confirmed_at ? true : false,
                        createdAt: userData.created_at
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'logAuthEvent': {
                const { eventType, eventData, success } = additionalData || {};
                
                if (!eventType) {
                    throw new Error('Event type is required');
                }

                // Log the authentication event
                await fetch(`${supabaseUrl}/rest/v1/rpc/log_auth_event`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_user_id: userId,
                        p_event_type: eventType,
                        p_event_data: eventData || null,
                        p_success: success !== undefined ? success : true
                    })
                });

                return new Response(JSON.stringify({
                    data: {
                        message: 'Event logged successfully'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Auth validation error:', error);

        const errorResponse = {
            error: {
                code: 'AUTH_VALIDATION_ERROR',
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