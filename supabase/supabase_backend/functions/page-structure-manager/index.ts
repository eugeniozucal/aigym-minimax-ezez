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
        const { parentType, parentId, includeBlocks, includeProgress, userId } = await req.json();

        if (!parentType || !parentId) {
            throw new Error('parentType and parentId are required');
        }

        // Support both 'wod' and 'mission' for backward compatibility
        if (!['wod', 'mission', 'course'].includes(parentType)) {
            throw new Error('parentType must be either "wod", "mission", or "course"');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log(`Fetching page structure for ${parentType} ${parentId}`);

        // Map parent type to table name and field name
        const tableMapping = {
            'wod': { table: 'wods', field: 'wod_id' },
            'mission': { table: 'wods', field: 'wod_id' }, // backward compatibility - mission maps to wods
            'course': { table: 'courses', field: 'course_id' }
        };

        const { table, field } = tableMapping[parentType];

        // Get parent entity (WOD or course)
        const parentResponse = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${parentId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!parentResponse.ok) {
            throw new Error(`Failed to fetch ${parentType}`);
        }

        const parents = await parentResponse.json();
        if (parents.length === 0) {
            throw new Error(`${parentType} not found`);
        }

        const parent = parents[0];

        // Get pages for this parent
        const pagesResponse = await fetch(`${supabaseUrl}/rest/v1/pages?${field}=eq.${parentId}&order=order_index.asc`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!pagesResponse.ok) {
            throw new Error('Failed to fetch pages');
        }

        const pages = await pagesResponse.json();
        console.log(`Found ${pages.length} pages`);

        // Get blocks if requested
        let pagesWithBlocks = pages;
        if (includeBlocks && pages.length > 0) {
            const pageIds = pages.map(p => p.id);
            
            const blocksResponse = await fetch(`${supabaseUrl}/rest/v1/blocks?page_id=in.(${pageIds.join(',')})&order=page_id.asc,order_index.asc`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (blocksResponse.ok) {
                const blocks = await blocksResponse.json();
                console.log(`Found ${blocks.length} total blocks`);
                
                // Group blocks by page_id
                const blocksByPage = blocks.reduce((acc, block) => {
                    if (!acc[block.page_id]) acc[block.page_id] = [];
                    acc[block.page_id].push(block);
                    return acc;
                }, {});
                
                // Attach blocks to pages
                pagesWithBlocks = pages.map(page => ({
                    ...page,
                    blocks: blocksByPage[page.id] || []
                }));
            }
        }

        // Get user progress if requested and user provided
        let progressData = null;
        if (includeProgress && userId) {
            const progressResponse = await fetch(`${supabaseUrl}/rest/v1/user_progress?user_id=eq.${userId}&${field}=eq.${parentId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (progressResponse.ok) {
                const progress = await progressResponse.json();
                console.log(`Found ${progress.length} progress records`);
                
                // Calculate overall progress
                const pageCompletions = progress.filter(p => p.progress_type === 'page_completed');
                const completedPageIds = new Set(pageCompletions.map(p => p.page_id));
                const totalPages = pages.length;
                const completedPages = completedPageIds.size;
                const overallProgress = totalPages > 0 ? (completedPages / totalPages) * 100 : 0;
                
                progressData = {
                    totalPages,
                    completedPages,
                    overallProgress: Math.round(overallProgress * 100) / 100,
                    progressRecords: progress,
                    lastActivity: progress.length > 0 ? progress.reduce((latest, p) => 
                        new Date(p.created_at) > new Date(latest.created_at) ? p : latest
                    ) : null
                };
            }
        }

        // Return consistent structure regardless of parent type
        const result = {
            [parentType === 'mission' ? 'wod' : parentType]: parent, // normalize mission to wod in response
            pages: pagesWithBlocks,
            totalPages: pages.length,
            progress: progressData
        };

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Page structure fetch error:', error);

        const errorResponse = {
            error: {
                code: 'PAGE_STRUCTURE_FETCH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});