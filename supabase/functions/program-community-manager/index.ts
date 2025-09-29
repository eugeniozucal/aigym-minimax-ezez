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
        const requestData = await req.json();
        const { action, program_id, community_id, program_ids, community_ids, assigned_by, role = 'assigned', signup_token } = requestData;
        
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
            throw new Error('Invalid token');
        }
        
        const userData = await userResponse.json();
        const userId = userData.id;

        // Verify admin permissions
        const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin&is_active=eq.true`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        if (!adminCheckResponse.ok) {
            throw new Error('Failed to verify admin permissions');
        }
        
        const adminRoles = await adminCheckResponse.json();
        if (adminRoles.length === 0) {
            throw new Error('Admin privileges required');
        }

        switch (action) {
            case 'assign_program_to_community':
                if (!program_id || !community_id) {
                    throw new Error('Program ID and Community ID are required');
                }
                
                const assignResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/assign_program_to_community_enhanced`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_program_id: program_id,
                        p_community_id: community_id,
                        p_assigned_by: assigned_by || userId,
                        p_role: role,
                        p_signup_token: signup_token
                    })
                });
                
                if (!assignResponse.ok) {
                    const errorText = await assignResponse.text();
                    throw new Error(`Failed to assign program to community: ${errorText}`);
                }
                
                const assignmentId = await assignResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        success: true,
                        assignment_id: assignmentId
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'remove_program_from_community':
                if (!program_id || !community_id) {
                    throw new Error('Program ID and Community ID are required');
                }
                
                const removeResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/remove_program_from_community`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_program_id: program_id,
                        p_community_id: community_id
                    })
                });
                
                if (!removeResponse.ok) {
                    const errorText = await removeResponse.text();
                    throw new Error(`Failed to remove program from community: ${errorText}`);
                }
                
                const removed = await removeResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        success: removed
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'bulk_assign_programs_to_community':
                if (!program_ids || !Array.isArray(program_ids) || !community_id) {
                    throw new Error('Program IDs array and Community ID are required');
                }
                
                const bulkAssignments = program_ids.map(pid => ({
                    program_id: pid,
                    community_id: community_id,
                    assigned_by: assigned_by || userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));
                
                const bulkAssignResponse = await fetch(`${supabaseUrl}/rest/v1/program_communities`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=ignore-duplicates'
                    },
                    body: JSON.stringify(bulkAssignments)
                });
                
                if (!bulkAssignResponse.ok) {
                    const errorText = await bulkAssignResponse.text();
                    throw new Error(`Failed to bulk assign programs: ${errorText}`);
                }
                
                return new Response(JSON.stringify({
                    data: {
                        success: true,
                        assigned_count: program_ids.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'bulk_assign_program_to_communities':
                if (!program_id || !community_ids || !Array.isArray(community_ids)) {
                    throw new Error('Program ID and Community IDs array are required');
                }
                
                const bulkCommunityAssignments = community_ids.map(cid => ({
                    program_id: program_id,
                    community_id: cid,
                    assigned_by: assigned_by || userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));
                
                const bulkCommunityResponse = await fetch(`${supabaseUrl}/rest/v1/program_communities`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=ignore-duplicates'
                    },
                    body: JSON.stringify(bulkCommunityAssignments)
                });
                
                if (!bulkCommunityResponse.ok) {
                    const errorText = await bulkCommunityResponse.text();
                    throw new Error(`Failed to bulk assign program to communities: ${errorText}`);
                }
                
                return new Response(JSON.stringify({
                    data: {
                        success: true,
                        assigned_count: community_ids.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'get_program_communities':
                if (!program_id) {
                    throw new Error('Program ID is required');
                }
                
                const programCommunitiesResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_program_communities_enhanced`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_program_id: program_id
                    })
                });
                
                if (!programCommunitiesResponse.ok) {
                    const errorText = await programCommunitiesResponse.text();
                    throw new Error(`Failed to get program communities: ${errorText}`);
                }
                
                const communities = await programCommunitiesResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        communities
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'get_community_programs':
                if (!community_id) {
                    throw new Error('Community ID is required');
                }
                
                const communityProgramsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_community_programs_enhanced`, {
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
                
                if (!communityProgramsResponse.ok) {
                    const errorText = await communityProgramsResponse.text();
                    throw new Error(`Failed to get community programs: ${errorText}`);
                }
                
                const programs = await communityProgramsResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        programs
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'get_program_assignment_status':
                const statusResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_program_assignment_status_enhanced`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_program_id: program_id || null,
                        p_community_id: community_id || null
                    })
                });
                
                if (!statusResponse.ok) {
                    const errorText = await statusResponse.text();
                    throw new Error(`Failed to get assignment status: ${errorText}`);
                }
                
                const assignmentStatus = await statusResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        communities: assignmentStatus
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Program Community Manager error:', error);

        const errorResponse = {
            error: {
                code: 'PROGRAM_COMMUNITY_MANAGER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});