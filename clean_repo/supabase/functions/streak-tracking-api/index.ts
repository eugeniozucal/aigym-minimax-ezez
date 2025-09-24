Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-community-info, apikey, content-type',
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
        const pathParts = url.pathname.split('/').filter(Boolean);
        const endpoint = pathParts[pathParts.length - 1];
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Authentication required for all operations
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authentication required');
        }
        
        const token = authHeader.replace('Bearer ', '');
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

        // Get current community (for multi-tenancy)
        const communityId = req.headers.get('x-community-id');
        if (!communityId) {
            throw new Error('Community ID required');
        }

        switch (method) {
            case 'GET':
                if (endpoint === 'streaks') {
                    // Get user's current streaks
                    const searchParams = new URLSearchParams(url.search);
                    const targetUserId = searchParams.get('user_id') || userId;
                    const streakType = searchParams.get('streak_type');
                    
                    let query = `select=*&user_id=eq.${targetUserId}&community_id=eq.${communityId}&order=streak_type.asc`;
                    if (streakType) {
                        query += `&streak_type=eq.${streakType}`;
                    }
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/user_streaks?${query}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch streaks');
                    }
                    
                    const streaks = await response.json();
                    return new Response(JSON.stringify({ data: streaks }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                } else if (endpoint === 'daily-activity') {
                    // Get user's daily activity
                    const searchParams = new URLSearchParams(url.search);
                    const targetUserId = searchParams.get('user_id') || userId;
                    const startDate = searchParams.get('start_date');
                    const endDate = searchParams.get('end_date');
                    const limit = parseInt(searchParams.get('limit') || '30');
                    
                    let query = `select=*&user_id=eq.${targetUserId}&community_id=eq.${communityId}&order=activity_date.desc&limit=${limit}`;
                    if (startDate) {
                        query += `&activity_date=gte.${startDate}`;
                    }
                    if (endDate) {
                        query += `&activity_date=lte.${endDate}`;
                    }
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/user_daily_activity?${query}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch daily activity');
                    }
                    
                    const activities = await response.json();
                    return new Response(JSON.stringify({ data: activities }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                } else if (endpoint === 'performance-history') {
                    // Get user's performance history
                    const searchParams = new URLSearchParams(url.search);
                    const targetUserId = searchParams.get('user_id') || userId;
                    const activityType = searchParams.get('activity_type');
                    const limit = parseInt(searchParams.get('limit') || '50');
                    
                    let query = `select=*&user_id=eq.${targetUserId}&community_id=eq.${communityId}&order=completed_at.desc&limit=${limit}`;
                    if (activityType) {
                        query += `&activity_type=eq.${activityType}`;
                    }
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/performance_history?${query}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch performance history');
                    }
                    
                    const performance = await response.json();
                    return new Response(JSON.stringify({ data: performance }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                break;

            case 'POST':
                if (endpoint === 'track-activity') {
                    // Track user activity and update streaks
                    const activityData = await req.json();
                    const { activity_type, activity_id, score, time_spent, context_data } = activityData;
                    
                    if (!activity_type) {
                        throw new Error('Activity type required');
                    }
                    
                    const results = {
                        streak_updates: [],
                        daily_activity_updated: false,
                        performance_recorded: false
                    };
                    
                    // Update daily activity
                    const dailyUpdateResponse = await fetch(`${supabaseUrl}/rpc/update_daily_activity`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            p_user_id: userId,
                            p_community_id: communityId,
                            p_activity_type: activity_type,
                            p_score: score,
                            p_time_spent: time_spent,
                            p_activity_date: new Date().toISOString().split('T')[0]
                        })
                    });
                    
                    if (dailyUpdateResponse.ok) {
                        results.daily_activity_updated = true;
                    }
                    
                    // Update relevant streaks
                    const streakTypes = [];
                    if (activity_type === 'login') {
                        streakTypes.push('login');
                    } else if (activity_type === 'wod') {
                        streakTypes.push('daily_wod');
                    } else if (activity_type === 'course') {
                        streakTypes.push('daily_course');
                    }
                    
                    for (const streakType of streakTypes) {
                        const streakUpdateResponse = await fetch(`${supabaseUrl}/rpc/update_user_streak`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                p_user_id: userId,
                                p_community_id: communityId,
                                p_streak_type: streakType,
                                p_activity_date: new Date().toISOString().split('T')[0],
                                p_performance_score: score
                            })
                        });
                        
                        if (streakUpdateResponse.ok) {
                            const streakResult = await streakUpdateResponse.json();
                            results.streak_updates.push({
                                streak_type: streakType,
                                ...streakResult
                            });
                        }
                    }
                    
                    // Record performance history if we have score data
                    if (score !== undefined && activity_id) {
                        const performanceData = {
                            user_id: userId,
                            client_id: clientId,
                            activity_type,
                            activity_id,
                            activity_name: context_data?.activity_name || null,
                            score,
                            completion_time: time_spent,
                            max_possible_score: context_data?.max_possible_score || 100,
                            difficulty_level: context_data?.difficulty_level,
                            estimated_duration: context_data?.estimated_duration,
                            performance_data: context_data || {},
                            completed_at: new Date().toISOString()
                        };
                        
                        // Determine performance level
                        const scorePercentage = (score / (context_data?.max_possible_score || 100)) * 100;
                        if (scorePercentage >= 100) {
                            performanceData.performance_level = 'perfect';
                        } else if (scorePercentage >= 90) {
                            performanceData.performance_level = 'excellent';
                        } else if (scorePercentage >= 80) {
                            performanceData.performance_level = 'above_average';
                        } else if (scorePercentage >= 70) {
                            performanceData.performance_level = 'average';
                        } else if (scorePercentage >= 60) {
                            performanceData.performance_level = 'below_average';
                        } else {
                            performanceData.performance_level = 'poor';
                        }
                        
                        const performanceResponse = await fetch(`${supabaseUrl}/rest/v1/performance_history`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(performanceData)
                        });
                        
                        if (performanceResponse.ok) {
                            results.performance_recorded = true;
                        }
                    }
                    
                    return new Response(JSON.stringify({ data: results }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                break;

            default:
                throw new Error('Method not allowed');
        }

        throw new Error('Invalid endpoint or method');

    } catch (error) {
        console.error('Streak Tracking API error:', error);

        const errorResponse = {
            error: {
                code: 'STREAK_TRACKING_API_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
