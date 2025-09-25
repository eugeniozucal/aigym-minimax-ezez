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
        const { email } = await req.json();

        console.log('Deleting test user:', email);

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // First, get the user ID from auth
        const getUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (getUserResponse.ok) {
            const usersData = await getUserResponse.json();
            const targetUser = usersData.users?.find((u: any) => u.email === email);
            
            if (targetUser) {
                console.log('Found user to delete:', targetUser.id);
                
                // Delete from auth
                const deleteAuthResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUser.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!deleteAuthResponse.ok) {
                    const errorText = await deleteAuthResponse.text();
                    console.error('Auth user deletion failed:', errorText);
                } else {
                    console.log('Auth user deleted successfully');
                }
            } else {
                console.log('User not found in auth');
            }
        }

        // Delete from custom tables
        const deleteProfilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${email}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        console.log('Profiles delete response:', deleteProfilesResponse.status);

        const deleteUsersResponse = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${email}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        console.log('Users delete response:', deleteUsersResponse.status);

        // Also try to delete from auth.users directly using SQL
        const deleteAuthSqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/delete_auth_user_by_email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_email: email })
        });
        console.log('Auth SQL delete response:', deleteAuthSqlResponse.status);

        const result = {
            data: {
                message: 'Test user deleted successfully'
            }
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Test user deletion error:', error);

        const errorResponse = {
            error: {
                code: 'USER_DELETION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});