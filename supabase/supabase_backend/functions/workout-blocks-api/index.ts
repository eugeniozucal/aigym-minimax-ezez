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
        const blockId = url.searchParams.get('id');
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !anonKey || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Default admin UUID for fallback
        const defaultAdminUuid = '84ee8814-0acd-48f6-a7ca-b6ec935b0d5e';

        // For GET requests, use service role to bypass RLS restrictions
        if (method === 'GET') {
            let apiUrl;
            if (blockId) {
                // Get specific workout block
                apiUrl = `${supabaseUrl}/rest/v1/workout_blocks?id=eq.${blockId}`;
            } else {
                // Get all workout blocks with optional filtering
                apiUrl = `${supabaseUrl}/rest/v1/workout_blocks?order=updated_at.desc`;
                
                // Apply filters from query parameters
                const status = url.searchParams.get('status');
                const difficulty = url.searchParams.get('difficulty');
                const category = url.searchParams.get('category');
                const search = url.searchParams.get('search');

                if (status && status !== 'all') {
                    apiUrl += `&status=eq.${status}`;
                }
                if (difficulty && difficulty !== 'all') {
                    apiUrl += `&difficulty_level=eq.${difficulty}`;
                }
                if (category && category !== 'all') {
                    apiUrl += `&block_category=eq.${category}`;
                }
                if (search) {
                    apiUrl += `&or=(title.ilike.*${search}*,description.ilike.*${search}*)`;
                }
            }

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Database query failed: ${errorText}`);
            }

            const data = await response.json();
            
            return new Response(JSON.stringify({ 
                data: blockId ? (data[0] || null) : data 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // For POST/PUT/DELETE, get user context but don't require authentication
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
            // Create workout block
            const requestData = await req.json();
            const {
                title,
                description,
                thumbnail_url,
                status,
                estimated_duration_minutes,
                difficulty_level,
                tags,
                block_category,
                equipment_needed,
                instructions,
                pages,
                settings,
                created_by
            } = requestData;
            
            const blockData = {
                title: title || 'Untitled Block',
                description: description || '',
                thumbnail_url: thumbnail_url || '',
                status: status || 'draft',
                estimated_duration_minutes: estimated_duration_minutes || 30,
                difficulty_level: difficulty_level || 'beginner',
                tags: tags || [],
                block_category: block_category || 'general',
                equipment_needed: equipment_needed || [],
                instructions: instructions || '',
                pages: pages || [],
                settings: settings || {},
                created_by: user?.id || created_by || defaultAdminUuid,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/workout_blocks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(blockData)
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
            // Update workout block
            const blockId = url.searchParams.get('id');
            const requestData = await req.json();

            if (!blockId) {
                throw new Error('Block ID is required for update');
            }

            const updateData = {
                ...requestData,
                updated_at: new Date().toISOString()
            };

            // Remove undefined fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const response = await fetch(`${supabaseUrl}/rest/v1/workout_blocks?id=eq.${blockId}`, {
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
            // Delete workout block
            const blockId = url.searchParams.get('id');

            if (!blockId) {
                throw new Error('Block ID is required for deletion');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/workout_blocks?id=eq.${blockId}`, {
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

            return new Response(JSON.stringify({ message: 'Workout block deleted successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Method not allowed
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Workout Blocks API Error:', error);
        
        return new Response(JSON.stringify({ 
            error: {
                code: 'WORKOUT_BLOCKS_API_ERROR',
                message: error.message || 'Internal server error'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});