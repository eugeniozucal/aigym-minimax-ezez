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

        console.log('Creating admin user for AI GYM platform...');

        // Check if admin exists in admins table first
        const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/admins?email=eq.ez@aiworkify.com&select=id,email,role`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!adminCheckResponse.ok) {
            throw new Error('Failed to check admin existence');
        }

        const adminData = await adminCheckResponse.json();
        if (!adminData || adminData.length === 0) {
            throw new Error('Admin record not found in database');
        }

        const admin = adminData[0];
        console.log('Found admin record:', admin);

        // Create user in Supabase Auth with specific UUID
        const authCreateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: admin.id, // Use the same ID from admins table
                email: 'ez@aiworkify.com',
                password: '12345678',
                email_confirm: true,
                user_metadata: {
                    role: 'admin',
                    is_admin: true,
                    admin_role: admin.role
                }
            })
        });

        if (!authCreateResponse.ok) {
            const errorText = await authCreateResponse.text();
            console.log('Auth creation response:', errorText);
            
            // If user already exists, try to update password
            if (errorText.includes('already exists') || errorText.includes('duplicate')) {
                console.log('User already exists, updating password...');
                
                const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${admin.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        password: '12345678',
                        email_confirm: true
                    })
                });

                if (!updateResponse.ok) {
                    const updateErrorText = await updateResponse.text();
                    throw new Error(`Failed to update user password: ${updateErrorText}`);
                }

                const updatedUser = await updateResponse.json();
                console.log('User password updated successfully:', updatedUser);

                return new Response(JSON.stringify({
                    data: {
                        message: 'Admin user password updated successfully',
                        user: updatedUser,
                        action: 'updated'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } else {
                throw new Error(`Failed to create auth user: ${errorText}`);
            }
        }

        const authUser = await authCreateResponse.json();
        console.log('Auth user created successfully:', authUser);

        // Verify the user can be retrieved
        const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${admin.id}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (verifyResponse.ok) {
            const verifiedUser = await verifyResponse.json();
            console.log('User verification successful:', verifiedUser);
        }

        return new Response(JSON.stringify({
            data: {
                message: 'Admin user created successfully',
                user: authUser,
                admin_record: admin,
                action: 'created'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin setup error:', error);

        const errorResponse = {
            error: {
                code: 'ADMIN_SETUP_FAILED',
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