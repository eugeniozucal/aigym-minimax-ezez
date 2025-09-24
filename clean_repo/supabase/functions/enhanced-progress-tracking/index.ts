// Enhanced Progress Tracking API - Granular state management with real-time updates
// Provides comprehensive learning state persistence with <200ms performance target

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

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        const url = new URL(req.url);
        const method = req.method;

        if (method === 'GET') {
            return await handleGetProgress(url, userId, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (method === 'POST') {
            const requestData = await req.json();
            return await handleUpdateProgress(requestData, userId, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (method === 'PUT') {
            const requestData = await req.json();
            return await handleBatchUpdateProgress(requestData, userId, supabaseUrl, serviceRoleKey, corsHeaders);
        }

        throw new Error('Method not supported');

    } catch (error) {
        console.error('Enhanced progress tracking error:', error);

        const errorResponse = {
            error: {
                code: 'ENHANCED_PROGRESS_TRACKING_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Handle GET requests for progress data
async function handleGetProgress(url: URL, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const queryType = url.searchParams.get('type') || 'summary';
    const contentId = url.searchParams.get('content_id');
    const contentType = url.searchParams.get('content_type'); // course, wod, page, block
    const includeAnalytics = url.searchParams.get('include_analytics') === 'true';
    
    let query = '';
    let endpoint = '';
    
    if (queryType === 'block_details' && contentId) {
        // Get detailed block completion data
        endpoint = '/rest/v1/block_completions';
        query = `?user_id=eq.${userId}&block_id=eq.${contentId}&select=*`;
    } else if (queryType === 'session_history') {
        // Get learning session history
        endpoint = '/rest/v1/learning_sessions';
        const limit = url.searchParams.get('limit') || '50';
        query = `?user_id=eq.${userId}&order=started_at.desc&limit=${limit}&select=*`;
    } else if (queryType === 'analytics' && contentId && contentType) {
        // Get comprehensive analytics for specific content
        return await getContentAnalytics(contentId, contentType, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    } else if (queryType === 'progress_aggregation') {
        // Get aggregated progress data using the view
        endpoint = '/rest/v1/user_learning_analytics';
        query = `?user_id=eq.${userId}`;
        if (contentType) {
            query += `&progress_type=eq.${contentType}`;
        }
    } else {
        // Default: Get enhanced user progress
        endpoint = '/rest/v1/user_progress';
        query = `?user_id=eq.${userId}&select=*`;
        if (contentId && contentType) {
            query += `&${contentType}_id=eq.${contentId}`;
        }
    }

    const response = await fetch(`${supabaseUrl}${endpoint}${query}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch progress data: ${await response.text()}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handle POST requests for single progress updates
async function handleUpdateProgress(requestData: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const { update_type, content_data, session_data, block_data } = requestData;
    
    const results: any = {};
    
    // Update block completion if provided
    if (update_type === 'block_completion' && block_data) {
        const blockResult = await updateBlockCompletion(block_data, userId, supabaseUrl, serviceRoleKey);
        results.block_completion = blockResult;
    }
    
    // Update learning session if provided
    if (update_type === 'session_update' && session_data) {
        const sessionResult = await updateLearningSession(session_data, userId, supabaseUrl, serviceRoleKey);
        results.session_update = sessionResult;
    }
    
    // Update overall progress if provided
    if (update_type === 'progress_update' && content_data) {
        const progressResult = await updateUserProgress(content_data, userId, supabaseUrl, serviceRoleKey);
        results.progress_update = progressResult;
    }
    
    // Smart caching and performance optimization
    if (update_type === 'real_time_update') {
        const optimizedResult = await handleRealTimeUpdate(requestData, userId, supabaseUrl, serviceRoleKey);
        results.real_time_update = optimizedResult;
    }
    
    return new Response(JSON.stringify({ data: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handle PUT requests for batch progress updates
async function handleBatchUpdateProgress(requestData: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const { batch_updates, optimize_performance } = requestData;
    
    if (!batch_updates || !Array.isArray(batch_updates)) {
        throw new Error('Batch updates must be an array');
    }
    
    const results = [];
    
    // Process batch updates with performance optimization
    for (const update of batch_updates) {
        try {
            if (update.type === 'block_completion') {
                const result = await updateBlockCompletion(update.data, userId, supabaseUrl, serviceRoleKey);
                results.push({ success: true, type: 'block_completion', data: result });
            } else if (update.type === 'progress_update') {
                const result = await updateUserProgress(update.data, userId, supabaseUrl, serviceRoleKey);
                results.push({ success: true, type: 'progress_update', data: result });
            }
        } catch (error) {
            results.push({ success: false, type: update.type, error: error.message });
        }
    }
    
    return new Response(JSON.stringify({ data: { batch_results: results, total_processed: results.length } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Update or create block completion record
async function updateBlockCompletion(blockData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    const {
        block_id,
        page_id,
        course_id,
        wod_id,
        client_id,
        completion_status,
        completion_percentage,
        time_spent_seconds,
        interaction_count,
        engagement_score,
        mastery_score,
        session_id,
        device_type,
        learning_context
    } = blockData;
    
    const updateData: any = {
        user_id: userId,
        block_id,
        page_id,
        client_id,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    // Add optional fields if provided
    if (course_id) updateData.course_id = course_id;
    if (wod_id) updateData.wod_id = wod_id;
    if (completion_status) updateData.completion_status = completion_status;
    if (completion_percentage !== undefined) updateData.completion_percentage = completion_percentage;
    if (time_spent_seconds !== undefined) {
        updateData.total_time_spent_seconds = time_spent_seconds;
        updateData.focused_time_seconds = Math.floor(time_spent_seconds * 0.8); // Estimate 80% focused
    }
    if (interaction_count !== undefined) updateData.interaction_count = interaction_count;
    if (engagement_score !== undefined) updateData.content_engagement_score = engagement_score;
    if (mastery_score !== undefined) {
        updateData.mastery_score = mastery_score;
        updateData.is_mastered = mastery_score >= 80; // 80% threshold for mastery
    }
    if (session_id) updateData.current_session_id = session_id;
    if (device_type) updateData.device_type = device_type;
    if (learning_context) updateData.learning_context = learning_context;
    
    // Set completion timestamps
    if (completion_status === 'in_progress' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
    } else if (completion_status === 'completed' || completion_status === 'mastered') {
        updateData.completed_at = new Date().toISOString();
    }
    
    // Upsert the block completion record
    const response = await fetch(`${supabaseUrl}/rest/v1/block_completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to update block completion: ${await response.text()}`);
    }
    
    return await response.json();
}

// Update or create learning session record
async function updateLearningSession(sessionData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    const {
        session_id,
        session_type,
        session_status,
        duration_seconds,
        focus_score,
        engagement_score,
        content_items,
        device_info,
        break_count,
        achievements_earned
    } = sessionData;
    
    const updateData: any = {
        user_id: userId,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    if (session_type) updateData.session_type = session_type;
    if (session_status) updateData.session_status = session_status;
    if (duration_seconds !== undefined) {
        updateData.total_duration_seconds = duration_seconds;
        updateData.active_duration_seconds = Math.floor(duration_seconds * 0.85); // Estimate 85% active
    }
    if (focus_score !== undefined) updateData.focus_score = focus_score;
    if (engagement_score !== undefined) updateData.engagement_score = engagement_score;
    if (content_items) updateData.content_items_accessed = content_items;
    if (device_info) updateData.device_info = device_info;
    if (break_count !== undefined) updateData.break_count = break_count;
    
    if (session_status === 'completed') {
        updateData.ended_at = new Date().toISOString();
    }
    
    let endpoint = `/rest/v1/learning_sessions`;
    let method = 'POST';
    let prefer = 'return=representation';
    
    if (session_id) {
        // Update existing session
        endpoint += `?id=eq.${session_id}`;
        method = 'PATCH';
        prefer = 'return=representation';
    }
    
    const response = await fetch(`${supabaseUrl}${endpoint}`, {
        method,
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': prefer
        },
        body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to update learning session: ${await response.text()}`);
    }
    
    return await response.json();
}

// Update user progress with enhanced metrics
async function updateUserProgress(contentData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    const {
        content_type,
        content_id,
        progress_percentage,
        learning_velocity,
        engagement_quality,
        retention_score,
        mastery_prediction,
        estimated_completion_time
    } = contentData;
    
    const updateData: any = {
        updated_at: new Date().toISOString()
    };
    
    if (progress_percentage !== undefined) updateData.completion_percentage = progress_percentage;
    if (learning_velocity !== undefined) updateData.learning_velocity_score = learning_velocity;
    if (engagement_quality !== undefined) updateData.engagement_quality_score = engagement_quality;
    if (retention_score !== undefined) updateData.knowledge_retention_score = retention_score;
    if (mastery_prediction !== undefined) updateData.mastery_prediction_score = mastery_prediction;
    if (estimated_completion_time) updateData.estimated_completion_time = estimated_completion_time;
    
    let whereClause = `user_id=eq.${userId}`;
    if (content_type && content_id) {
        whereClause += `&${content_type}_id=eq.${content_id}`;
    }
    
    const response = await fetch(`${supabaseUrl}/rest/v1/user_progress?${whereClause}`, {
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
        throw new Error(`Failed to update user progress: ${await response.text()}`);
    }
    
    return await response.json();
}

// Handle real-time updates with performance optimization
async function handleRealTimeUpdate(requestData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    const { updates, priority } = requestData;
    
    // Implement smart caching and batching for high-frequency updates
    const batchSize = priority === 'high' ? 1 : 5;
    const results = [];
    
    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (update: any) => {
            if (update.type === 'block_interaction') {
                return await updateBlockCompletion(update.data, userId, supabaseUrl, serviceRoleKey);
            } else if (update.type === 'session_heartbeat') {
                return await updateLearningSession(update.data, userId, supabaseUrl, serviceRoleKey);
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    
    return { processed: results.length, updates: results };
}

// Get comprehensive content analytics
async function getContentAnalytics(contentId: string, contentType: string, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const analytics: any = {};
    
    // Get block-level analytics
    if (contentType === 'course' || contentType === 'wod') {
        const blockResponse = await fetch(
            `${supabaseUrl}/rest/v1/block_completions?user_id=eq.${userId}&${contentType}_id=eq.${contentId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        if (blockResponse.ok) {
            analytics.block_completions = await blockResponse.json();
        }
    }
    
    // Get session analytics
    const sessionResponse = await fetch(
        `${supabaseUrl}/rest/v1/learning_sessions?user_id=eq.${userId}&content_items_accessed.cs.{"${contentId}"}&select=*`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );
    
    if (sessionResponse.ok) {
        analytics.learning_sessions = await sessionResponse.json();
    }
    
    // Get overall progress
    const progressResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_progress?user_id=eq.${userId}&${contentType}_id=eq.${contentId}&select=*`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );
    
    if (progressResponse.ok) {
        analytics.progress_data = await progressResponse.json();
    }
    
    return new Response(JSON.stringify({ data: analytics }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}