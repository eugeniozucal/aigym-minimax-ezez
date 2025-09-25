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
        const url = new URL(req.url);
        const method = req.method;
        const wodId = url.searchParams.get('id');
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !anonKey || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // For GET requests, use public access
        if (method === 'GET') {
            let apiUrl;
            if (wodId) {
                // Get specific WOD
                apiUrl = `${supabaseUrl}/rest/v1/wods?id=eq.${wodId}`;
            } else {
                // Get all WODs
                apiUrl = `${supabaseUrl}/rest/v1/wods?order=created_at.desc`;
            }

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${anonKey}`,
                    'apikey': anonKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Database query failed: ${errorText}`);
            }

            const data = await response.json();
            
            return new Response(JSON.stringify({ 
                data: wodId ? (data[0] || null) : data 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // For POST/PUT/DELETE, require authentication
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        let user = null;
        if (token) {
            // Verify token and get user
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });

            if (userResponse.ok) {
                user = await userResponse.json();
            }
        }

        if (method === 'POST') {
            // Create WOD - require authentication
            if (!user) {
                throw new Error('Authentication required for creating WODs');
            }

            const requestData = await req.json();
            const { title, description, status, thumbnail_url, tags, created_by } = requestData;

            const wodData = {
                title: title || 'Untitled WOD',
                description: description || '',
                status: status || 'draft',
                thumbnail_url: thumbnail_url || '',
                tags: tags || [],
                created_by: created_by || user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/wods`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(wodData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Database insert failed: ${errorText}`);
            }

            const data = await response.json();

            return new Response(JSON.stringify({ data: data[0] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 201
            });
        }

        if (method === 'PUT') {
            // Update WOD
            const wodId = url.searchParams.get('id');
            const requestData = await req.json();

            if (!wodId) {
                throw new Error('WOD ID is required for update');
            }

            const updateData = {
                ...requestData,
                updated_at: new Date().toISOString()
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/wods?id=eq.${wodId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Database update failed: ${errorText}`);
            }

            const data = await response.json();

            return new Response(JSON.stringify({ data: data[0] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (method === 'DELETE') {
            // Delete WOD
            const wodId = url.searchParams.get('id');

            if (!wodId) {
                throw new Error('WOD ID is required for deletion');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/wods?id=eq.${wodId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Database delete failed: ${errorText}`);
            }

            return new Response(JSON.stringify({ message: 'WOD deleted successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Method not allowed
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('WODs API Error:', error);
        
        return new Response(JSON.stringify({ 
            error: error.message || 'Internal server error',
            details: error.toString()
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});