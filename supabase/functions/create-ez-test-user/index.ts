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
        console.log('Creating ez@eugeniozucal.com test user...');

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!serviceRoleKey || !supabaseUrl || !anonKey) {
            throw new Error('Supabase configuration missing');
        }

        // First, try to use the regular signup method
        const signupResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey
            },
            body: JSON.stringify({
                email: 'ez@eugeniozucal.com',
                password: 'EzU8264!',
                data: {
                    first_name: 'Ez',
                    last_name: 'Zucal'
                }
            })
        });

        let authUser;
        if (signupResponse.ok) {
            const signupData = await signupResponse.json();
            authUser = signupData.user;
            console.log('User created via signup:', authUser?.id);
        } else {
            // If signup fails, try admin creation
            console.log('Signup failed, trying admin creation');
            const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey
                },
                body: JSON.stringify({
                    email: 'ez@eugeniozucal.com',
                    password: 'EzU8264!',
                    email_confirm: true,
                    user_metadata: {
                        first_name: 'Ez',
                        last_name: 'Zucal'
                    }
                })
            });

            if (!adminResponse.ok) {
                const errorText = await adminResponse.text();
                console.error('Admin user creation failed:', errorText);
                throw new Error(`User creation failed: ${errorText}`);
            }

            authUser = await adminResponse.json();
            console.log('User created via admin API:', authUser.id);
        }

        if (!authUser) {
            throw new Error('Failed to create user');
        }

        const clientId = 'e9563aa3-6ada-488f-9bbb-53932250b3f7';

        // Insert user into custom users table
        const userInsertResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                id: authUser.id,
                client_id: clientId,
                community_id: clientId,
                email: 'ez@eugeniozucal.com',
                first_name: 'Ez',
                last_name: 'Zucal',
                created_at: new Date().toISOString()
            })
        });

        if (!userInsertResponse.ok) {
            const errorText = await userInsertResponse.text();
            console.warn('User table insert failed:', errorText);
        } else {
            console.log('User inserted into users table successfully');
        }

        // Insert into profiles table
        const profileInsertResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                id: authUser.id,
                email: 'ez@eugeniozucal.com',
                first_name: 'Ez',
                last_name: 'Zucal',
                is_admin: false,
                client_id: clientId,
                created_at: new Date().toISOString()
            })
        });

        if (!profileInsertResponse.ok) {
            const errorText = await profileInsertResponse.text();
            console.warn('Profile insert failed:', errorText);
        } else {
            console.log('Profile inserted successfully');
        }

        const result = {
            data: {
                user: authUser,
                credentials: {
                    email: 'ez@eugeniozucal.com',
                    password: 'EzU8264!'
                },
                message: 'Ez test user created successfully'
            }
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Ez test user creation error:', error);

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