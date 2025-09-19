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
        const { email, password } = await req.json();

        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Sign in with Supabase Auth
        const signInResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (!signInResponse.ok) {
            const errorData = await signInResponse.text();
            console.error('Sign in failed:', errorData);
            throw new Error('Invalid credentials');
        }

        const authData = await signInResponse.json();
        const userId = authData.user?.id;

        if (!userId) {
            throw new Error('Failed to get user ID from auth response');
        }

        // Check if user is an admin
        const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/admins?id=eq.${userId}&select=id,email,role`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!adminCheckResponse.ok) {
            throw new Error('Failed to verify admin status');
        }

        const adminData = await adminCheckResponse.json();
        if (!adminData || adminData.length === 0) {
            throw new Error('User is not an admin');
        }

        const admin = adminData[0];

        // Log successful admin login
        const auditLogResponse = await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin_id: userId,
                action_type: 'admin_login',
                table_name: 'auth',
                new_values: { login_timestamp: new Date().toISOString() }
            })
        });

        if (!auditLogResponse.ok) {
            console.warn('Failed to log admin login audit');
        }

        return new Response(JSON.stringify({
            data: {
                access_token: authData.access_token,
                refresh_token: authData.refresh_token,
                expires_in: authData.expires_in,
                user: {
                    id: userId,
                    email: admin.email,
                    role: admin.role,
                    is_admin: true
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin login error:', error);

        const errorResponse = {
            error: {
                code: 'ADMIN_LOGIN_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});