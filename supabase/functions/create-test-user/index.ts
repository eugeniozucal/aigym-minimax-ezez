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
        // Get Supabase configuration
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Creating test user with Admin API...');

        // First, try to delete any existing phantom user
        const deleteUrl = `${supabaseUrl}/auth/v1/admin/users`;
        
        // Get existing users to find the user ID if it exists
        const getUsersResponse = await fetch(`${deleteUrl}?email=eq.ez@eugeniozucal.com`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (getUsersResponse.ok) {
            const existingUsers = await getUsersResponse.json();
            if (existingUsers.users && existingUsers.users.length > 0) {
                const existingUserId = existingUsers.users[0].id;
                console.log(`Deleting existing user: ${existingUserId}`);
                
                // Delete the existing user
                const deleteResponse = await fetch(`${deleteUrl}/${existingUserId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                if (deleteResponse.ok) {
                    console.log('Existing user deleted successfully');
                } else {
                    console.log('Failed to delete existing user, but continuing...');
                }
            }
        }

        // Create new user via Admin API
        const createUserUrl = `${supabaseUrl}/auth/v1/admin/users`;
        const createUserResponse = await fetch(createUserUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'ez@eugeniozucal.com',
                password: 'EzU8264!',
                email_confirm: true,
                user_metadata: {
                    first_name: 'Test',
                    last_name: 'User'
                }
            })
        });

        if (!createUserResponse.ok) {
            const errorText = await createUserResponse.text();
            throw new Error(`Failed to create user: ${errorText}`);
        }

        const userData = await createUserResponse.json();
        const userId = userData.id;
        console.log(`User created with ID: ${userId}`);

        // Create profile record
        const profileUrl = `${supabaseUrl}/rest/v1/profiles`;
        const profileResponse = await fetch(profileUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                id: userId,
                email: 'ez@eugeniozucal.com',
                first_name: 'Test',
                last_name: 'User',
                is_admin: false,
                organization_id: 1 // Assuming organization 1 exists
            })
        });

        if (!profileResponse.ok) {
            const profileErrorText = await profileResponse.text();
            console.error('Profile creation error:', profileErrorText);
            // Don't throw here, user creation is more important
        } else {
            console.log('Profile created successfully');
        }

        return new Response(JSON.stringify({ 
            data: {
                success: true, 
                message: 'Test user created successfully',
                user_id: userId,
                email: 'ez@eugeniozucal.com'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('User creation error:', error);
        
        const errorResponse = {
            error: {
                code: 'USER_CREATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});