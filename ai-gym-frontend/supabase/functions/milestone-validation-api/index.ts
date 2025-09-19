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

        // Get current client (for multi-tenancy)
        const clientId = req.headers.get('x-client-id');
        if (!clientId) {
            throw new Error('Client ID required');
        }

        switch (method) {
            case 'GET':
                if (endpoint === 'milestones') {
                    // Get milestones for a course or program
                    const searchParams = new URLSearchParams(url.search);
                    const courseId = searchParams.get('course_id');
                    const programId = searchParams.get('program_id');
                    const type = searchParams.get('type'); // 'course' or 'program'
                    const includeProgress = searchParams.get('include_progress') === 'true';
                    
                    let query, tableName, idField;
                    
                    if (type === 'course' || courseId) {
                        tableName = 'course_milestones';
                        idField = courseId;
                        query = `select=*&course_id=eq.${courseId}&status=eq.active&order=sequence_order.asc`;
                    } else if (type === 'program' || programId) {
                        tableName = 'program_milestones';
                        idField = programId;
                        query = `select=*&program_id=eq.${programId}&status=eq.active&order=sequence_order.asc`;
                    } else {
                        throw new Error('Course ID or Program ID required');
                    }
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch milestones');
                    }
                    
                    const milestones = await response.json();
                    
                    // Include user progress if requested
                    if (includeProgress && milestones.length > 0) {
                        const milestoneIds = milestones.map(m => m.id);
                        const progressQuery = `select=*&user_id=eq.${userId}&milestone_id=in.(${milestoneIds.join(',')})&milestone_type=eq.${type || (courseId ? 'course' : 'program')}`;
                        
                        const progressResponse = await fetch(`${supabaseUrl}/rest/v1/user_milestone_progress?${progressQuery}`, {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (progressResponse.ok) {
                            const progressData = await progressResponse.json();
                            const progressMap = {};
                            progressData.forEach(p => {
                                progressMap[p.milestone_id] = p;
                            });
                            
                            milestones.forEach(milestone => {
                                milestone.user_progress = progressMap[milestone.id] || null;
                            });
                        }
                    }
                    
                    return new Response(JSON.stringify({ data: milestones }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                } else if (endpoint === 'progress') {
                    // Get user's milestone progress
                    const searchParams = new URLSearchParams(url.search);
                    const targetUserId = searchParams.get('user_id') || userId;
                    const milestoneType = searchParams.get('type');
                    const status = searchParams.get('status');
                    
                    let query = `select=*,course_milestones(*),program_milestones(*)&user_id=eq.${targetUserId}&client_id=eq.${clientId}`;
                    
                    if (milestoneType) {
                        query += `&milestone_type=eq.${milestoneType}`;
                    }
                    if (status) {
                        query += `&status=eq.${status}`;
                    }
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/user_milestone_progress?${query}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch milestone progress');
                    }
                    
                    const progress = await response.json();
                    return new Response(JSON.stringify({ data: progress }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                break;

            case 'POST':
                if (endpoint === 'validate') {
                    // Validate milestone completion
                    const validationData = await req.json();
                    const { milestone_id, milestone_type, validation_data, score, completion_evidence } = validationData;
                    
                    if (!milestone_id || !milestone_type) {
                        throw new Error('Milestone ID and type required');
                    }
                    
                    // Get milestone details
                    const tableName = milestone_type === 'course' ? 'course_milestones' : 'program_milestones';
                    const milestoneResponse = await fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${milestone_id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });
                    
                    if (!milestoneResponse.ok) {
                        throw new Error('Milestone not found');
                    }
                    
                    const milestones = await milestoneResponse.json();
                    if (milestones.length === 0) {
                        throw new Error('Milestone not found');
                    }
                    
                    const milestone = milestones[0];
                    
                    // Validate based on criteria
                    let isValid = true;
                    let validationResult = { passed: true, details: {} };
                    
                    if (milestone.required_score && score !== undefined) {
                        isValid = score >= milestone.required_score;
                        validationResult.score_check = {
                            required: milestone.required_score,
                            achieved: score,
                            passed: isValid
                        };
                    }
                    
                    // Check custom validation criteria
                    if (milestone.validation_criteria && Object.keys(milestone.validation_criteria).length > 0) {
                        // This would be expanded based on specific validation rules
                        // For now, we'll assume validation passes if validation_data is provided
                        if (!validation_data || Object.keys(validation_data).length === 0) {
                            isValid = false;
                            validationResult.criteria_check = { passed: false, reason: 'Validation data required' };
                        }
                    }
                    
                    // Update or create progress record
                    const progressUpdate = {
                        user_id: userId,
                        milestone_id,
                        milestone_type,
                        status: isValid ? 'completed' : 'failed',
                        progress_percentage: isValid ? 100 : Math.min((score || 0) / (milestone.required_score || 100) * 100, 99),
                        current_score: score,
                        validation_data,
                        validation_method: milestone.auto_validation ? 'automatic' : 'manual',
                        validated_by: userId,
                        validated_at: isValid ? new Date().toISOString() : null,
                        completed_at: isValid ? new Date().toISOString() : null,
                        client_id: clientId,
                        attempts_count: 1
                    };
                    
                    // Try to update existing progress first
                    const existingProgressResponse = await fetch(
                        `${supabaseUrl}/rest/v1/user_milestone_progress?user_id=eq.${userId}&milestone_id=eq.${milestone_id}&milestone_type=eq.${milestone_type}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    
                    let progressResponse;
                    if (existingProgressResponse.ok) {
                        const existingProgress = await existingProgressResponse.json();
                        if (existingProgress.length > 0) {
                            // Update existing
                            progressUpdate.attempts_count = (existingProgress[0].attempts_count || 0) + 1;
                            progressResponse = await fetch(
                                `${supabaseUrl}/rest/v1/user_milestone_progress?user_id=eq.${userId}&milestone_id=eq.${milestone_id}&milestone_type=eq.${milestone_type}`,
                                {
                                    method: 'PATCH',
                                    headers: {
                                        'Authorization': `Bearer ${serviceRoleKey}`,
                                        'apikey': serviceRoleKey,
                                        'Content-Type': 'application/json',
                                        'Prefer': 'return=representation'
                                    },
                                    body: JSON.stringify(progressUpdate)
                                }
                            );
                        } else {
                            // Create new
                            progressResponse = await fetch(`${supabaseUrl}/rest/v1/user_milestone_progress`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${serviceRoleKey}`,
                                    'apikey': serviceRoleKey,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=representation'
                                },
                                body: JSON.stringify(progressUpdate)
                            });
                        }
                    } else {
                        // Create new if we can't check existing
                        progressResponse = await fetch(`${supabaseUrl}/rest/v1/user_milestone_progress`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify(progressUpdate)
                        });
                    }
                    
                    if (!progressResponse.ok) {
                        const errorText = await progressResponse.text();
                        throw new Error(`Failed to update progress: ${errorText}`);
                    }
                    
                    const updatedProgress = await progressResponse.json();
                    
                    // Trigger achievement checking if milestone was completed
                    let achievementResults = null;
                    if (isValid && milestone.completion_achievement_id) {
                        try {
                            const achievementResponse = await fetch(`${supabaseUrl}/functions/v1/achievements-api/award`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'apikey': serviceRoleKey,
                                    'Content-Type': 'application/json',
                                    'x-client-id': clientId
                                },
                                body: JSON.stringify({
                                    achievement_id: milestone.completion_achievement_id,
                                    user_ids: [userId],
                                    context_type: milestone_type,
                                    context_id: milestone_id,
                                    award_reason: 'Milestone completion'
                                })
                            });
                            
                            if (achievementResponse.ok) {
                                achievementResults = await achievementResponse.json();
                            }
                        } catch (achievementError) {
                            console.log('Achievement award failed:', achievementError.message);
                        }
                    }
                    
                    return new Response(JSON.stringify({ 
                        data: {
                            progress: Array.isArray(updatedProgress) ? updatedProgress[0] : updatedProgress,
                            validation_result: validationResult,
                            milestone_completed: isValid,
                            achievements_awarded: achievementResults?.data || null
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                } else if (endpoint === 'trigger-achievements') {
                    // Bulk achievement trigger based on user progress
                    const triggerData = await req.json();
                    const { context_type, context_id, trigger_type } = triggerData;
                    
                    if (!context_type || !trigger_type) {
                        throw new Error('Context type and trigger type required');
                    }
                    
                    const triggeredAchievements = [];
                    
                    // Get user's current progress stats from existing progress tracking
                    const statsResponse = await getUserProgressStats(userId, clientId, serviceRoleKey, supabaseUrl);
                    
                    if (trigger_type === 'completion' || trigger_type === 'all') {
                        // Check completion-based achievements
                        const completionAchievements = await checkCompletionAchievements(
                            userId, clientId, context_type, context_id, statsResponse, serviceRoleKey, supabaseUrl, token
                        );
                        triggeredAchievements.push(...completionAchievements);
                    }
                    
                    if (trigger_type === 'streak' || trigger_type === 'all') {
                        // Check streak-based achievements
                        const streakAchievements = await checkStreakAchievements(
                            userId, clientId, statsResponse, serviceRoleKey, supabaseUrl, token
                        );
                        triggeredAchievements.push(...streakAchievements);
                    }
                    
                    if (trigger_type === 'mastery' || trigger_type === 'all') {
                        // Check mastery-based achievements
                        const masteryAchievements = await checkMasteryAchievements(
                            userId, clientId, statsResponse, serviceRoleKey, supabaseUrl, token
                        );
                        triggeredAchievements.push(...masteryAchievements);
                    }
                    
                    return new Response(JSON.stringify({ 
                        data: {
                            triggered_achievements: triggeredAchievements,
                            user_stats: statsResponse,
                            trigger_context: { context_type, context_id, trigger_type }
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                break;

            case 'PUT':
                if (endpoint === 'manual-validation') {
                    // Manual milestone validation by instructor/admin
                    const manualData = await req.json();
                    const { progress_id, validation_decision, feedback, score } = manualData;
                    
                    if (!progress_id || !validation_decision) {
                        throw new Error('Progress ID and validation decision required');
                    }
                    
                    const updateData = {
                        status: validation_decision === 'approve' ? 'validated' : 'failed',
                        validation_method: 'manual',
                        validated_by: userId,
                        validated_at: new Date().toISOString(),
                        feedback,
                        current_score: score,
                        progress_percentage: validation_decision === 'approve' ? 100 : 0
                    };
                    
                    if (validation_decision === 'approve') {
                        updateData.completed_at = new Date().toISOString();
                    }
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/user_milestone_progress?id=eq.${progress_id}`, {
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
                        throw new Error(`Failed to update validation: ${errorText}`);
                    }
                    
                    const updatedProgress = await response.json();
                    return new Response(JSON.stringify({ data: updatedProgress[0] }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                break;

            default:
                throw new Error('Method not allowed');
        }

        throw new Error('Invalid endpoint or method');

    } catch (error) {
        console.error('Milestone Validation API error:', error);

        const errorResponse = {
            error: {
                code: 'MILESTONE_VALIDATION_API_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to get user progress statistics
async function getUserProgressStats(userId, clientId, serviceRoleKey, supabaseUrl) {
    try {
        // Get WOD completions
        const wodResponse = await fetch(`${supabaseUrl}/rest/v1/user_progress?user_id=eq.${userId}&client_id=eq.${clientId}&content_type=eq.wod&completion_status=eq.completed&select=id`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        const wodCompletions = wodResponse.ok ? (await wodResponse.json()).length : 0;
        
        // Get Course completions
        const courseResponse = await fetch(`${supabaseUrl}/rest/v1/user_progress?user_id=eq.${userId}&client_id=eq.${clientId}&content_type=eq.course&completion_status=eq.completed&select=id`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        const courseCompletions = courseResponse.ok ? (await courseResponse.json()).length : 0;
        
        // Get Program completions
        const programResponse = await fetch(`${supabaseUrl}/rest/v1/program_enrollments?user_id=eq.${userId}&client_id=eq.${clientId}&status=eq.completed&select=id`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        const programCompletions = programResponse.ok ? (await programResponse.json()).length : 0;
        
        // Get Milestone completions
        const milestoneResponse = await fetch(`${supabaseUrl}/rest/v1/user_milestone_progress?user_id=eq.${userId}&client_id=eq.${clientId}&status=eq.completed&select=id`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        const milestoneCompletions = milestoneResponse.ok ? (await milestoneResponse.json()).length : 0;
        
        // Get current streaks
        const streaksResponse = await fetch(`${supabaseUrl}/rest/v1/user_streaks?user_id=eq.${userId}&client_id=eq.${clientId}&is_active=eq.true`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        const streaks = streaksResponse.ok ? await streaksResponse.json() : [];
        const streakData = {};
        streaks.forEach(streak => {
            streakData[streak.streak_type] = {
                current_streak: streak.current_streak,
                longest_streak: streak.longest_streak,
                total_activities: streak.total_activities,
                average_performance: streak.average_performance,
                best_performance: streak.best_performance
            };
        });
        
        // Get recent performance data
        const perfResponse = await fetch(`${supabaseUrl}/rest/v1/performance_history?user_id=eq.${userId}&client_id=eq.${clientId}&order=completed_at.desc&limit=20`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        const recentPerformance = perfResponse.ok ? await perfResponse.json() : [];
        
        // Calculate performance metrics
        const perfectScores = recentPerformance.filter(p => p.performance_level === 'perfect').length;
        const excellentScores = recentPerformance.filter(p => p.performance_level === 'excellent').length;
        const highScores = recentPerformance.filter(p => ['excellent', 'perfect'].includes(p.performance_level)).length;
        
        const avgScore = recentPerformance.length > 0 
            ? recentPerformance.reduce((sum, p) => sum + (p.score || 0), 0) / recentPerformance.length
            : 0;
        
        return {
            wod_completions: wodCompletions,
            course_completions: courseCompletions,
            program_completions: programCompletions,
            milestones_completed: milestoneCompletions,
            streaks: streakData,
            performance: {
                perfect_scores: perfectScores,
                excellent_scores: excellentScores,
                high_scores: highScores,
                average_score: avgScore,
                total_assessments: recentPerformance.length,
                recent_performance: recentPerformance.slice(0, 10)
            }
        };
    } catch (error) {
        console.log('Failed to get progress stats:', error);
        return {
            wod_completions: 0,
            course_completions: 0,
            program_completions: 0,
            milestones_completed: 0,
            streaks: {},
            performance: {
                perfect_scores: 0,
                excellent_scores: 0,
                high_scores: 0,
                average_score: 0,
                total_assessments: 0,
                recent_performance: []
            }
        };
    }
}

// Helper function to check completion-based achievements
async function checkCompletionAchievements(userId, clientId, contextType, contextId, stats, serviceRoleKey, supabaseUrl, token) {
    const triggeredAchievements = [];
    
    try {
        // Get completion-based achievements that haven't been earned yet
        const achievementsResponse = await fetch(`${supabaseUrl}/rest/v1/achievements?achievement_type=eq.completion&status=eq.active&or=(client_id=is.null,client_id=eq.${clientId})`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        if (!achievementsResponse.ok) return triggeredAchievements;
        
        const achievements = await achievementsResponse.json();
        
        for (const achievement of achievements) {
            const criteria = achievement.criteria;
            let shouldAward = false;
            
            // Check WOD completion achievements
            if (criteria.wod_completions && stats.wod_completions >= criteria.wod_completions) {
                shouldAward = true;
            }
            
            // Check Course completion achievements
            if (criteria.course_completions && stats.course_completions >= criteria.course_completions) {
                shouldAward = true;
            }
            
            // Check Program completion achievements
            if (criteria.program_completions && stats.program_completions >= criteria.program_completions) {
                shouldAward = true;
            }
            
            // Check Milestone completion achievements
            if (criteria.milestones_completed && stats.milestones_completed >= criteria.milestones_completed) {
                shouldAward = true;
            }
            
            if (shouldAward) {
                // Check if user already has this achievement
                const existingResponse = await fetch(`${supabaseUrl}/rest/v1/user_achievements?user_id=eq.${userId}&achievement_id=eq.${achievement.id}&is_completed=eq.true`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                if (existingResponse.ok) {
                    const existing = await existingResponse.json();
                    if (existing.length === 0) {
                        // Award the achievement
                        const awardResponse = await fetch(`${supabaseUrl}/functions/v1/achievements-api/award`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json',
                                'x-client-id': clientId
                            },
                            body: JSON.stringify({
                                achievement_id: achievement.id,
                                user_ids: [userId],
                                context_type: contextType,
                                context_id: contextId,
                                award_reason: 'Automatic trigger based on completion criteria'
                            })
                        });
                        
                        if (awardResponse.ok) {
                            const awardResult = await awardResponse.json();
                            triggeredAchievements.push(awardResult.data[0]);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log('Error checking completion achievements:', error);
    }
    
    return triggeredAchievements;
}

// Helper function to check streak-based achievements
async function checkStreakAchievements(userId, clientId, stats, serviceRoleKey, supabaseUrl, token) {
    const triggeredAchievements = [];
    
    try {
        // Get streak-based achievements that haven't been earned yet
        const achievementsResponse = await fetch(`${supabaseUrl}/rest/v1/achievements?achievement_type=eq.streak&status=eq.active&or=(client_id=is.null,client_id=eq.${clientId})`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        if (!achievementsResponse.ok) return triggeredAchievements;
        
        const achievements = await achievementsResponse.json();
        
        for (const achievement of achievements) {
            const criteria = achievement.criteria;
            let shouldAward = false;
            
            // Check login streak achievements
            if (criteria.login_streak && stats.streaks.login) {
                shouldAward = stats.streaks.login.current_streak >= criteria.login_streak;
            }
            
            // Check daily WOD streak achievements
            if (criteria.daily_wod_streak && stats.streaks.daily_wod) {
                shouldAward = stats.streaks.daily_wod.current_streak >= criteria.daily_wod_streak;
            }
            
            // Check weekly activity streak achievements
            if (criteria.weekly_activity_streak && stats.streaks.weekly_activity) {
                shouldAward = stats.streaks.weekly_activity.current_streak >= criteria.weekly_activity_streak;
            }
            
            // Check any streak milestone
            if (criteria.any_streak_days) {
                const maxStreak = Math.max(
                    stats.streaks.login?.current_streak || 0,
                    stats.streaks.daily_wod?.current_streak || 0,
                    stats.streaks.daily_course?.current_streak || 0
                );
                shouldAward = maxStreak >= criteria.any_streak_days;
            }
            
            if (shouldAward) {
                // Check if user already has this achievement
                const existingResponse = await fetch(`${supabaseUrl}/rest/v1/user_achievements?user_id=eq.${userId}&achievement_id=eq.${achievement.id}&is_completed=eq.true`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                if (existingResponse.ok) {
                    const existing = await existingResponse.json();
                    if (existing.length === 0) {
                        // Award the achievement
                        const awardResponse = await fetch(`${supabaseUrl}/functions/v1/achievements-api/award`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json',
                                'x-client-id': clientId
                            },
                            body: JSON.stringify({
                                achievement_id: achievement.id,
                                user_ids: [userId],
                                context_type: 'streak',
                                context_id: null,
                                award_reason: 'Automatic trigger based on streak criteria'
                            })
                        });
                        
                        if (awardResponse.ok) {
                            const awardResult = await awardResponse.json();
                            triggeredAchievements.push({
                                achievement: achievement,
                                award_data: awardResult.data[0],
                                trigger_reason: 'streak_milestone',
                                streak_data: stats.streaks
                            });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log('Error checking streak achievements:', error);
    }
    
    return triggeredAchievements;
}

// Helper function to check mastery-based achievements
async function checkMasteryAchievements(userId, clientId, stats, serviceRoleKey, supabaseUrl, token) {
    const triggeredAchievements = [];
    
    try {
        // Get mastery-based achievements that haven't been earned yet
        const achievementsResponse = await fetch(`${supabaseUrl}/rest/v1/achievements?achievement_type=eq.mastery&status=eq.active&or=(client_id=is.null,client_id=eq.${clientId})`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        if (!achievementsResponse.ok) return triggeredAchievements;
        
        const achievements = await achievementsResponse.json();
        
        for (const achievement of achievements) {
            const criteria = achievement.criteria;
            let shouldAward = false;
            
            // Check perfect score achievements
            if (criteria.perfect_scores && stats.performance.perfect_scores >= criteria.perfect_scores) {
                shouldAward = true;
            }
            
            // Check high average achievements
            if (criteria.high_average_assessments && criteria.minimum_average) {
                if (stats.performance.total_assessments >= criteria.high_average_assessments && 
                    stats.performance.average_score >= criteria.minimum_average) {
                    shouldAward = true;
                }
            }
            
            // Check consecutive high scores
            if (criteria.consecutive_high_scores && criteria.minimum_score) {
                const recentPerf = stats.performance.recent_performance;
                if (recentPerf.length >= criteria.consecutive_high_scores) {
                    const consecutiveHighScores = recentPerf.slice(0, criteria.consecutive_high_scores)
                        .every(p => (p.score || 0) >= criteria.minimum_score);
                    if (consecutiveHighScores) {
                        shouldAward = true;
                    }
                }
            }
            
            // Check fast completion achievements (speed learning)
            if (criteria.fast_completion_percentage) {
                // This would need estimated vs actual time data
                // We'll check if user has recent fast completions
                const fastCompletions = stats.performance.recent_performance.filter(p => 
                    p.actual_vs_estimated_ratio && p.actual_vs_estimated_ratio <= (criteria.fast_completion_percentage / 100)
                ).length;
                
                if (criteria.fast_completions) {
                    shouldAward = fastCompletions >= criteria.fast_completions;
                } else if (fastCompletions > 0) {
                    shouldAward = true;
                }
            }
            
            // Check excellence consistency (maintaining high performance)
            if (criteria.excellence_consistency) {
                const excellentRate = stats.performance.total_assessments > 0 
                    ? (stats.performance.excellent_scores + stats.performance.perfect_scores) / stats.performance.total_assessments
                    : 0;
                shouldAward = excellentRate >= (criteria.excellence_consistency / 100);
            }
            
            // Check improvement trend
            if (criteria.improvement_trend && stats.performance.recent_performance.length >= 5) {
                const recentScores = stats.performance.recent_performance.slice(0, 5).map(p => p.score || 0);
                const isImproving = recentScores.every((score, index) => 
                    index === 0 || score >= recentScores[index - 1]
                );
                if (isImproving && recentScores[recentScores.length - 1] > recentScores[0]) {
                    shouldAward = true;
                }
            }
            
            if (shouldAward) {
                // Check if user already has this achievement
                const existingResponse = await fetch(`${supabaseUrl}/rest/v1/user_achievements?user_id=eq.${userId}&achievement_id=eq.${achievement.id}&is_completed=eq.true`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                if (existingResponse.ok) {
                    const existing = await existingResponse.json();
                    if (existing.length === 0) {
                        // Award the achievement
                        const awardResponse = await fetch(`${supabaseUrl}/functions/v1/achievements-api/award`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json',
                                'x-client-id': clientId
                            },
                            body: JSON.stringify({
                                achievement_id: achievement.id,
                                user_ids: [userId],
                                context_type: 'mastery',
                                context_id: null,
                                award_reason: 'Automatic trigger based on mastery criteria'
                            })
                        });
                        
                        if (awardResponse.ok) {
                            const awardResult = await awardResponse.json();
                            triggeredAchievements.push({
                                achievement: achievement,
                                award_data: awardResult.data[0],
                                trigger_reason: 'mastery_milestone',
                                performance_data: stats.performance
                            });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log('Error checking mastery achievements:', error);
    }
    
    return triggeredAchievements;
}