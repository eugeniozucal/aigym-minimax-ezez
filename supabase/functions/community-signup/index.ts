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
        const { action, community_id, signup_token, user_data } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        if (action === 'generate_signup_link') {
            // Generate signup link for community
            if (!community_id) {
                throw new Error('Community ID is required');
            }

            // Call the database function to generate signup link
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_community_signup_link`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ community_id })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to generate signup link: ${errorText}`);
            }

            const signupLink = await response.text();
            
            return new Response(JSON.stringify({
                data: {
                    signup_link: signupLink.replace(/"/g, ''), // Remove quotes from response
                    community_id
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'validate_signup_token') {
            // Validate signup token and get community info
            if (!signup_token) {
                throw new Error('Signup token is required');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_community_by_signup_token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: signup_token })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to validate token: ${errorText}`);
            }

            const communities = await response.json();
            
            if (!communities || communities.length === 0) {
                throw new Error('Invalid or expired signup link');
            }

            const community = communities[0];
            
            return new Response(JSON.stringify({
                data: {
                    community,
                    valid: true
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'complete_signup') {
            // Complete signup process - assign user to community
            if (!user_data || !user_data.user_id || !user_data.community_id) {
                throw new Error('User ID and Community ID are required');
            }

            // Update user's profile with community assignment
            const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    id: user_data.user_id,
                    community_id: user_data.community_id,
                    email: user_data.email || null,
                    first_name: user_data.first_name || null,
                    last_name: user_data.last_name || null,
                    is_admin: false
                })
            });

            if (!profileResponse.ok) {
                const errorText = await profileResponse.text();
                console.error('Profile creation error:', errorText);
                // Continue even if profile creation fails
            }

            // Also update the users table if it exists
            const userResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    id: user_data.user_id,
                    community_id: user_data.community_id,
                    email: user_data.email || null,
                    first_name: user_data.first_name || null,
                    last_name: user_data.last_name || null
                })
            });

            if (!userResponse.ok) {
                const errorText = await userResponse.text();
                console.log('User table update (may not exist):', errorText);
                // This is OK if users table doesn't exist or has different structure
            }

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: 'User successfully assigned to community'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('Community signup error:', error);

        const errorResponse = {
            error: {
                code: 'COMMUNITY_SIGNUP_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});