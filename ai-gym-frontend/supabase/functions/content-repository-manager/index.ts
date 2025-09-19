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
        const { action, contentType, searchQuery, filters, sortBy = 'created_at', sortOrder = 'desc', limit = 50, offset = 0 } = await req.json();

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Validate user authentication
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authorization header required');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify user token
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid authentication token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Define content type mappings
        const contentTables = {
            'videos': 'videos',
            'documents': 'documents',
            'prompts': 'prompts',
            'automations': 'automations',
            'ai_agents': 'ai_agents',
            'images': 'uploaded_files'
        };

        const tableName = contentTables[contentType];
        if (!tableName) {
            throw new Error(`Invalid content type: ${contentType}`);
        }

        // Build query URL
        let queryUrl = `${supabaseUrl}/rest/v1/${tableName}?select=*&limit=${limit}&offset=${offset}&order=${sortBy}.${sortOrder}`;

        // Add search filter if provided
        if (searchQuery) {
            if (tableName === 'uploaded_files') {
                queryUrl += `&or=(filename.ilike.*${encodeURIComponent(searchQuery)}*,original_filename.ilike.*${encodeURIComponent(searchQuery)}*)`;
            } else {
                queryUrl += `&or=(title.ilike.*${encodeURIComponent(searchQuery)}*,description.ilike.*${encodeURIComponent(searchQuery)}*)`;
            }
        }

        // Add status filter for content items
        if (tableName !== 'uploaded_files') {
            queryUrl += `&status=eq.published`;
        } else {
            // For uploaded files, filter by mime type if needed
            if (filters?.mimeType) {
                queryUrl += `&mime_type=like.${encodeURIComponent(filters.mimeType)}*`;
            }
        }

        // Add additional filters
        if (filters?.tags && filters.tags.length > 0) {
            queryUrl += `&tags=cs.{${filters.tags.join(',')}}`;
        }

        if (filters?.difficulty) {
            queryUrl += `&difficulty_level=eq.${filters.difficulty}`;
        }

        // Fetch content from database
        const contentResponse = await fetch(queryUrl, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!contentResponse.ok) {
            const errorText = await contentResponse.text();
            throw new Error(`Failed to fetch content: ${errorText}`);
        }

        const contentData = await contentResponse.json();

        // Transform data for consistent API response
        const transformedData = contentData.map(item => {
            if (tableName === 'uploaded_files') {
                return {
                    id: item.id,
                    title: item.filename || item.original_filename || 'Untitled',
                    description: `File: ${item.mime_type} (${Math.round(item.file_size / 1024)}KB)`,
                    thumbnail_url: item.mime_type?.startsWith('image/') ? item.file_url : null,
                    file_url: item.file_url,
                    content_type: 'file',
                    metadata: {
                        file_size: item.file_size,
                        mime_type: item.mime_type,
                        file_path: item.file_path
                    },
                    created_at: item.created_at,
                    updated_at: item.updated_at || item.created_at
                };
            } else {
                return {
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    thumbnail_url: item.thumbnail_url,
                    content_type: contentType.slice(0, -1), // Remove 's' from end
                    status: item.status,
                    tags: item.tags || [],
                    difficulty_level: item.difficulty_level,
                    metadata: item.metadata || {},
                    created_at: item.created_at,
                    updated_at: item.updated_at
                };
            }
        });

        // Get total count for pagination
        const countUrl = `${supabaseUrl}/rest/v1/${tableName}?select=count`;
        const countResponse = await fetch(countUrl, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let totalCount = contentData.length;
        if (countResponse.ok) {
            const countData = await countResponse.json();
            totalCount = countData[0]?.count || totalCount;
        }

        return new Response(JSON.stringify({
            data: {
                items: transformedData,
                pagination: {
                    total: totalCount,
                    limit,
                    offset,
                    hasMore: (offset + limit) < totalCount
                },
                contentType,
                searchQuery,
                filters
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Content repository error:', error);

        const errorResponse = {
            error: {
                code: 'CONTENT_REPOSITORY_ERROR',
                message: error.message || 'Failed to manage content repository'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});