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
        const { users } = await req.json();
        
        if (!users || !Array.isArray(users)) {
            throw new Error('users array is required with format: [{ email: string, password: string }]');
        }
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Create Supabase client with service role key for admin operations
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const results = [];

        for (const userInfo of users) {
            const { email, password } = userInfo;
            
            if (!email || !password) {
                results.push({ email: email || 'unknown', success: false, error: 'Email and password are required' });
                continue;
            }
            
            try {
                // Get user by email
                const { data: usersList, error: getUserError } = await supabase.auth.admin.listUsers();
                
                if (getUserError) {
                    results.push({ email, success: false, error: `Failed to list users: ${getUserError.message}` });
                    continue;
                }

                const user = usersList.users.find(u => u.email === email);
                
                if (!user) {
                    results.push({ email, success: false, error: 'User not found' });
                    continue;
                }

                // Update user password using Auth Admin API
                const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
                    user.id,
                    {
                        password: password
                    }
                );

                if (updateError) {
                    results.push({ email, success: false, error: `Failed to update password: ${updateError.message}` });
                    continue;
                }

                results.push({ 
                    email, 
                    success: true, 
                    message: 'Password updated successfully',
                    user_id: user.id
                });
            } catch (error) {
                results.push({ email, success: false, error: error.message });
            }
        }

        return new Response(JSON.stringify({
            data: {
                results,
                total_processed: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Set password error:', error);

        const errorResponse = {
            error: {
                code: 'SET_PASSWORD_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
