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
        const { emails } = await req.json();
        
        if (!emails || !Array.isArray(emails)) {
            throw new Error('emails array is required');
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

        for (const email of emails) {
            try {
                // Get user by email
                const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
                
                if (getUserError) {
                    results.push({ email, success: false, error: `Failed to list users: ${getUserError.message}` });
                    continue;
                }

                const user = users.users.find(u => u.email === email);
                
                if (!user) {
                    results.push({ email, success: false, error: 'User not found' });
                    continue;
                }

                // Update user to confirmed status using Auth Admin API
                const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
                    user.id,
                    {
                        email_confirm: true
                    }
                );

                if (updateError) {
                    results.push({ email, success: false, error: `Failed to confirm user: ${updateError.message}` });
                    continue;
                }

                results.push({ 
                    email, 
                    success: true, 
                    message: 'User confirmed successfully',
                    user_id: user.id,
                    confirmed_at: updatedUser.user.email_confirmed_at
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
        console.error('User confirmation error:', error);

        const errorResponse = {
            error: {
                code: 'USER_CONFIRMATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
