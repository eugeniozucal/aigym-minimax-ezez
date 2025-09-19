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
        const { pages, userId, parentId, parentType } = await req.json();

        if (!pages || !Array.isArray(pages) || pages.length === 0) {
            throw new Error('Pages array is required');
        }

        if (!userId || !parentId || !parentType) {
            throw new Error('userId, parentId, and parentType are required');
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

        console.log(`Creating ${pages.length} pages for ${parentType} ${parentId}`);

        const createdPages = [];

        // Map parent type to field name
        const fieldMapping = {
            'wod': 'wod_id',
            'mission': 'wod_id', // backward compatibility - mission maps to wod_id
            'course': 'course_id'
        };

        const parentField = fieldMapping[parentType];

        // Create pages sequentially to maintain order
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            
            const pageData = {
                title: page.title,
                description: page.description || null,
                [parentField]: parentId,
                order_index: i,
                is_locked: page.is_locked || false,
                unlock_conditions: page.unlock_conditions || {},
                page_config: page.page_config || {},
                status: page.status || 'draft',
                created_by: userId
            };

            // Create page
            const pageResponse = await fetch(`${supabaseUrl}/rest/v1/pages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(pageData)
            });

            if (!pageResponse.ok) {
                const errorText = await pageResponse.text();
                throw new Error(`Failed to create page ${i + 1}: ${errorText}`);
            }

            const createdPage = await pageResponse.json();
            const pageId = createdPage[0].id;
            
            console.log(`Created page ${i + 1}: ${pageId}`);

            // Create blocks if provided
            if (page.blocks && Array.isArray(page.blocks) && page.blocks.length > 0) {
                const blocksData = page.blocks.map((block, blockIndex) => ({
                    page_id: pageId,
                    block_type: block.block_type,
                    order_index: blockIndex,
                    config: block.config || {},
                    style: block.style || {},
                    content: block.content || {},
                    visibility_conditions: block.visibility_conditions || {},
                    is_visible: block.is_visible !== false,
                    created_by: userId
                }));

                const blocksResponse = await fetch(`${supabaseUrl}/rest/v1/blocks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(blocksData)
                });

                if (!blocksResponse.ok) {
                    const errorText = await blocksResponse.text();
                    console.warn(`Failed to create blocks for page ${pageId}: ${errorText}`);
                } else {
                    const createdBlocks = await blocksResponse.json();
                    console.log(`Created ${createdBlocks.length} blocks for page ${pageId}`);
                }
            }

            createdPages.push(createdPage[0]);
        }

        return new Response(JSON.stringify({
            data: {
                pages: createdPages,
                parentType: parentType === 'mission' ? 'wod' : parentType, // normalize response
                parentId,
                totalPages: createdPages.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Bulk page creation error:', error);

        const errorResponse = {
            error: {
                code: 'BULK_PAGE_CREATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});