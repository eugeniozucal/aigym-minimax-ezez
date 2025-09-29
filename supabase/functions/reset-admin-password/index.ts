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

        const adminEmail = 'ez@aiworkify.com';
        const newPassword = 'EzU8264!';

        // Get the admin user ID
        const getUserResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_user_by_email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_email: adminEmail
            })
        });

        if (!getUserResponse.ok) {
            throw new Error('Failed to get user details');
        }

        const userData = await getUserResponse.json();
        if (!userData || userData.length === 0) {
            throw new Error('Admin user not found');
        }

        const userId = userData[0].id;

        // Reset password using Supabase Admin API
        const resetResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: newPassword
            })
        });

        if (!resetResponse.ok) {
            const errorText = await resetResponse.text();
            throw new Error(`Failed to reset password: ${errorText}`);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Admin password reset successfully',
            email: adminEmail,
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Password reset error:', error);

        const errorResponse = {
            error: {
                code: 'PASSWORD_RESET_FAILED',
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
