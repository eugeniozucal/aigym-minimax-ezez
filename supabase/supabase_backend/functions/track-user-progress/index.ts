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
        const { userId, progressType, wodId, missionId, courseId, pageId, blockId, progressData, completionPercentage, timeSpent } = await req.json();

        if (!userId || !progressType) {
            throw new Error('userId and progressType are required');
        }

        // Support both wodId (new) and missionId (backward compatibility)
        const actualWodId = wodId || missionId;
        
        if (!actualWodId && !courseId) {
            throw new Error('Either wodId or courseId is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log(`Tracking progress: ${progressType} for user ${userId}`);

        // Create progress record using new wod_id field
        const progressRecord = {
            user_id: userId,
            wod_id: actualWodId || null,
            course_id: courseId || null,
            page_id: pageId || null,
            block_id: blockId || null,
            progress_type: progressType,
            progress_data: progressData || {},
            completion_percentage: completionPercentage || 0,
            time_spent_seconds: timeSpent || 0
        };

        const response = await fetch(`${supabaseUrl}/rest/v1/user_progress`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(progressRecord)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to track progress: ${errorText}`);
        }

        const createdProgress = await response.json();
        console.log(`Progress tracked successfully: ${createdProgress[0].id}`);

        // Calculate aggregated progress if needed
        let aggregatedProgress = null;
        
        if (progressType === 'page_completed' && (actualWodId || courseId)) {
            // Calculate overall progress for the WOD/course
            const parentField = actualWodId ? 'wod_id' : 'course_id';
            const parentId = actualWodId || courseId;
            
            // Get total pages
            const pagesResponse = await fetch(`${supabaseUrl}/rest/v1/pages?${parentField}=eq.${parentId}&select=id`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            if (pagesResponse.ok) {
                const pages = await pagesResponse.json();
                const totalPages = pages.length;
                
                // Get completed pages for this user
                const completedResponse = await fetch(
                    `${supabaseUrl}/rest/v1/user_progress?user_id=eq.${userId}&${parentField}=eq.${parentId}&progress_type=eq.page_completed&select=page_id`, 
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                
                if (completedResponse.ok) {
                    const completedPages = await completedResponse.json();
                    const completedCount = new Set(completedPages.map(p => p.page_id)).size;
                    const overallProgress = totalPages > 0 ? (completedCount / totalPages) * 100 : 0;
                    
                    aggregatedProgress = {
                        totalPages,
                        completedPages: completedCount,
                        overallProgress: Math.round(overallProgress * 100) / 100
                    };
                }
            }
        }

        return new Response(JSON.stringify({
            data: {
                progress: createdProgress[0],
                aggregatedProgress
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Progress tracking error:', error);

        const errorResponse = {
            error: {
                code: 'PROGRESS_TRACKING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});