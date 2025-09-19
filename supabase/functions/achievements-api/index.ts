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
        const achievementId = pathParts[pathParts.length - 1];
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        let userId = null;
        
        // For public GET requests (listing achievements), allow unauthenticated access
        if (method === 'GET' && authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                }
            } catch (error) {
                console.log('Failed to decode user, continuing with public access');
            }
        } else if (method !== 'GET') {
            // For POST/PUT/DELETE operations, require authentication
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
            userId = userData.id;
        }

        // Get current community (for multi-tenancy)
        const communityId = req.headers.get('x-community-id') || null;

        switch (method) {
            case 'GET':
                if (achievementId && achievementId !== 'achievements-api') {
                    const endpoint = pathParts[pathParts.length - 2];
                    
                    if (endpoint === 'user-achievements') {
                        // Get user's achievements with detailed information
                        const targetUserId = userId || achievementId;
                        
                        const selectFields = `
                            *,
                            achievements(
                                id,
                                title,
                                description,
                                icon_url,
                                badge_color,
                                achievement_type,
                                category,
                                difficulty_level,
                                point_value,
                                is_rare
                            )
                        `;
                        
                        let query = `select=${selectFields}&user_id=eq.${targetUserId}&order=earned_at.desc.nullslast,created_at.desc`;
                        if (communityId) {
                            query += `&community_id=eq.${communityId}`;
                        }
                        
                        const response = await fetch(`${supabaseUrl}/rest/v1/user_achievements?${query}`, {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to fetch user achievements');
                        }
                        
                        const userAchievements = await response.json();
                        
                        // Calculate statistics
                        const earnedCount = userAchievements.filter(ua => ua.is_completed).length;
                        const totalPoints = userAchievements
                            .filter(ua => ua.is_completed)
                            .reduce((sum, ua) => sum + (ua.achievements?.point_value || 0), 0);
                        
                        const stats = {
                            totalAchievements: userAchievements.length,
                            earnedAchievements: earnedCount,
                            totalPoints,
                            completionRate: userAchievements.length > 0 ? (earnedCount / userAchievements.length * 100) : 0,
                            rareAchievements: userAchievements.filter(ua => ua.is_completed && ua.achievements?.is_rare).length
                        };
                        
                        return new Response(JSON.stringify({ 
                            data: userAchievements,
                            statistics: stats
                        }), {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                    } else if (endpoint === 'leaderboard') {
                        // Get achievement leaderboard
                        const searchParams = new URLSearchParams(url.search);
                        const period = searchParams.get('period') || 'all'; // all, month, week
                        const category = searchParams.get('category') || 'all';
                        const limit = parseInt(searchParams.get('limit') || '50');
                        
                        let dateFilter = '';
                        if (period === 'month') {
                            dateFilter = `&earned_at=gte.${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`;
                        } else if (period === 'week') {
                            dateFilter = `&earned_at=gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`;
                        }
                        
                        let categoryFilter = '';
                        if (category !== 'all') {
                            categoryFilter = `&achievements.category=eq.${category}`;
                        }
                        
                        let query = `select=user_id,achievements(point_value,category)&is_completed=eq.true${dateFilter}${categoryFilter}`;
                        if (communityId) {
                            query += `&community_id=eq.${communityId}`;
                        }
                        
                        const response = await fetch(`${supabaseUrl}/rest/v1/user_achievements?${query}`, {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to fetch leaderboard data');
                        }
                        
                        const achievements = await response.json();
                        
                        // Calculate user points and rank
                        const userPoints = {};
                        achievements.forEach(achievement => {
                            const userId = achievement.user_id;
                            const points = achievement.achievements?.point_value || 0;
                            userPoints[userId] = (userPoints[userId] || 0) + points;
                        });
                        
                        // Sort and limit
                        const leaderboard = Object.entries(userPoints)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, limit)
                            .map(([userId, points], index) => ({
                                rank: index + 1,
                                user_id: userId,
                                total_points: points
                            }));
                        
                        return new Response(JSON.stringify({ data: leaderboard }), {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                    } else {
                        // Get specific achievement with detailed information
                        const selectFields = `
                            *,
                            user_achievements(
                                id,
                                user_id,
                                is_completed,
                                earned_at,
                                current_progress,
                                required_progress
                            )
                        `;
                        
                        const response = await fetch(`${supabaseUrl}/rest/v1/achievements?id=eq.${achievementId}&select=${selectFields}`, {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to fetch achievement');
                        }
                        
                        const achievements = await response.json();
                        if (achievements.length === 0) {
                            throw new Error('Achievement not found');
                        }
                        
                        const achievement = achievements[0];
                        
                        // Calculate achievement statistics
                        const completedCount = achievement.user_achievements?.filter(ua => ua.is_completed).length || 0;
                        const totalAttempts = achievement.user_achievements?.length || 0;
                        
                        const stats = {
                            totalAttempts,
                            completedCount,
                            completionRate: totalAttempts > 0 ? (completedCount / totalAttempts * 100) : 0
                        };
                        
                        return new Response(JSON.stringify({ 
                            data: {
                                ...achievement,
                                statistics: stats
                            }
                        }), {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                    }
                } else {
                    // List achievements with filtering
                    const searchParams = new URLSearchParams(url.search);
                    const type = searchParams.get('type');
                    const category = searchParams.get('category');
                    const difficulty = searchParams.get('difficulty');
                    const status = searchParams.get('status') || 'active';
                    const search = searchParams.get('search');
                    const limit = parseInt(searchParams.get('limit') || '50');
                    const offset = parseInt(searchParams.get('offset') || '0');
                    const includeUserProgress = searchParams.get('include_user_progress') === 'true' && userId;
                    
                    let selectFields = '*';
                    if (includeUserProgress) {
                        selectFields += `,user_achievements!inner(id,current_progress,required_progress,is_completed,earned_at)`;
                    }
                    
                    let query = `select=${selectFields}&status=eq.${status}&limit=${limit}&offset=${offset}&order=sort_order.asc,created_at.desc`;
                    
                    // Add filters
                    const filters = [];
                    if (type && type !== 'all') {
                        filters.push(`achievement_type=eq.${type}`);
                    }
                    if (category && category !== 'all') {
                        filters.push(`category=eq.${category}`);
                    }
                    if (difficulty && difficulty !== 'all') {
                        filters.push(`difficulty_level=eq.${difficulty}`);
                    }
                    if (communityId) {
                        filters.push(`or=(community_id=is.null,community_id=eq.${communityId})`);
                    }
                    if (includeUserProgress) {
                        filters.push(`user_achievements.user_id=eq.${userId}`);
                    }
                    
                    if (filters.length > 0) {
                        query += `&${filters.join('&')}`;
                    }
                    
                    // Add search filter if provided
                    if (search) {
                        query += `&or=(title.ilike.%${search}%,description.ilike.%${search}%)`;
                    }
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/achievements?${query}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch achievements');
                    }
                    
                    const achievements = await response.json();
                    return new Response(JSON.stringify({ data: achievements }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

            case 'POST':
                if (!userId) {
                    throw new Error('Authentication required for creating achievements');
                }
                
                const endpoint = pathParts[pathParts.length - 1];
                
                if (endpoint === 'award') {
                    // Award achievement to user(s)
                    const awardData = await req.json();
                    const { achievement_id, user_ids, context_type, context_id, award_reason } = awardData;
                    
                    if (!achievement_id || !user_ids || !Array.isArray(user_ids)) {
                        throw new Error('Achievement ID and user IDs array required');
                    }
                    
                    // Verify achievement exists
                    const achievementResponse = await fetch(`${supabaseUrl}/rest/v1/achievements?id=eq.${achievement_id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });
                    
                    if (!achievementResponse.ok) {
                        throw new Error('Achievement not found');
                    }
                    
                    const achievements = await achievementResponse.json();
                    if (achievements.length === 0) {
                        throw new Error('Achievement not found');
                    }
                    
                    const achievement = achievements[0];
                    
                    // Create user achievement records
                    const userAchievements = user_ids.map(targetUserId => ({
                        user_id: targetUserId,
                        achievement_id,
                        context_type,
                        context_id,
                        current_progress: achievement.criteria?.required_progress || 1,
                        required_progress: achievement.criteria?.required_progress || 1,
                        is_completed: true,
                        earned_at: new Date().toISOString(),
                        awarded_by: userId,
                        award_reason,
                        community_id: communityId
                    }));
                    
                    const awardResponse = await fetch(`${supabaseUrl}/rest/v1/user_achievements`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(userAchievements)
                    });
                    
                    if (!awardResponse.ok) {
                        const errorText = await awardResponse.text();
                        throw new Error(`Failed to award achievements: ${errorText}`);
                    }
                    
                    const awardedAchievements = await awardResponse.json();
                    return new Response(JSON.stringify({ 
                        data: awardedAchievements,
                        summary: {
                            achievement_id,
                            users_awarded: user_ids.length,
                            awarded_by: userId
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                } else {
                    // Create new achievement
                    const createData = await req.json();
                    const newAchievement = {
                        ...createData,
                        created_by: userId,
                        community_id: communityId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    const createResponse = await fetch(`${supabaseUrl}/rest/v1/achievements`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(newAchievement)
                    });
                    
                    if (!createResponse.ok) {
                        const errorText = await createResponse.text();
                        throw new Error(`Failed to create achievement: ${errorText}`);
                    }
                    
                    const createdAchievement = await createResponse.json();
                    return new Response(JSON.stringify({ data: createdAchievement[0] }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

            case 'PUT':
                if (!achievementId || achievementId === 'achievements-api') {
                    throw new Error('Achievement ID required for update');
                }
                
                if (!userId) {
                    throw new Error('Authentication required for updating achievements');
                }
                
                const updateData = await req.json();
                const achievementUpdate = {
                    ...updateData,
                    updated_at: new Date().toISOString()
                };
                
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/achievements?id=eq.${achievementId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(achievementUpdate)
                });
                
                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update achievement: ${errorText}`);
                }
                
                const updatedAchievement = await updateResponse.json();
                return new Response(JSON.stringify({ data: updatedAchievement[0] }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'DELETE':
                if (!achievementId || achievementId === 'achievements-api') {
                    throw new Error('Achievement ID required for deletion');
                }
                
                if (!userId) {
                    throw new Error('Authentication required for deleting achievements');
                }
                
                const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/achievements?id=eq.${achievementId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!deleteResponse.ok) {
                    const errorText = await deleteResponse.text();
                    throw new Error(`Failed to delete achievement: ${errorText}`);
                }
                
                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            default:
                throw new Error('Method not allowed');
        }

    } catch (error) {
        console.error('Achievements API error:', error);

        const errorResponse = {
            error: {
                code: 'ACHIEVEMENTS_API_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});