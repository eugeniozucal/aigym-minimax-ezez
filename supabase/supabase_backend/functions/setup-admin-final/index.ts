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

        console.log('Setting up admin user for AI GYM platform...');

        const adminEmail = 'ez@aiworkify.com';
        const adminPassword = 'EzU8264!';

        // Create user in Supabase Auth first
        const authCreateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: adminEmail,
                password: adminPassword,
                email_confirm: true,
                user_metadata: {
                    role: 'admin',
                    is_admin: true,
                    admin_role: 'super_admin',
                    full_name: 'Admin User'
                }
            })
        });

        let authUser;
        if (authCreateResponse.ok) {
            authUser = await authCreateResponse.json();
            console.log('Auth user created successfully:', authUser.id);
        } else {
            const errorText = await authCreateResponse.text();
            console.log('Auth creation failed, checking if user exists:', errorText);
            
            // If user already exists, get existing user
            if (errorText.includes('already exists') || errorText.includes('duplicate')) {
                console.log('User already exists, getting existing user...');
                
                // Get existing user by email
                const existingUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(adminEmail)}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (existingUserResponse.ok) {
                    const usersData = await existingUserResponse.json();
                    if (usersData.users && usersData.users.length > 0) {
                        authUser = usersData.users[0];
                        console.log('Found existing user:', authUser.id);
                        
                        // Update password
                        const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUser.id}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                password: adminPassword,
                                email_confirm: true,
                                user_metadata: {
                                    role: 'admin',
                                    is_admin: true,
                                    admin_role: 'super_admin',
                                    full_name: 'Admin User'
                                }
                            })
                        });

                        if (!updateResponse.ok) {
                            const updateErrorText = await updateResponse.text();
                            console.warn('Failed to update user password:', updateErrorText);
                        } else {
                            console.log('User password updated successfully');
                        }
                    }
                }
            } else {
                throw new Error(`Failed to create auth user: ${errorText}`);
            }
        }

        if (!authUser || !authUser.id) {
            throw new Error('Failed to create or retrieve auth user');
        }

        // Create or update admin record in admins table
        const adminData = {
            id: authUser.id,
            email: adminEmail,
            password_hash: '', // Will be updated by database trigger
            role: 'super_admin'
        };

        const adminInsertResponse = await fetch(`${supabaseUrl}/rest/v1/admins`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(adminData)
        });

        if (!adminInsertResponse.ok) {
            const errorText = await adminInsertResponse.text();
            console.log('Admin record creation failed, trying update:', errorText);
            
            // Try to update existing admin record
            const updateAdminResponse = await fetch(`${supabaseUrl}/rest/v1/admins?id=eq.${authUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: adminEmail,
                    role: 'super_admin'
                })
            });

            if (!updateAdminResponse.ok) {
                const updateErrorText = await updateAdminResponse.text();
                console.warn('Failed to update admin record:', updateErrorText);
            }
        }

        return new Response(JSON.stringify({
            data: {
                message: 'Admin user setup completed successfully',
                credentials: {
                    email: adminEmail,
                    password: adminPassword
                },
                user: {
                    id: authUser.id,
                    email: authUser.email,
                    role: 'super_admin'
                },
                instructions: 'Use these credentials to login to the admin panel'
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