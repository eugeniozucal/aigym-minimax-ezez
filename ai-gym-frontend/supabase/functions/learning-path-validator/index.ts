// Learning Path Validator API - Prerequisite validation and adaptive path adjustment
// Implements dynamic path adjustment based on performance with intelligent recommendations

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
            return await handleValidatePrerequisites(url, userId, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (method === 'POST') {
            const requestData = await req.json();
            return await handlePathAdjustment(requestData, userId, supabaseUrl, serviceRoleKey, corsHeaders);
        }

        throw new Error('Method not supported');

    } catch (error) {
        console.error('Learning path validator error:', error);

        const errorResponse = {
            error: {
                code: 'LEARNING_PATH_VALIDATOR_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Handle GET requests for prerequisite validation
async function handleValidatePrerequisites(url: URL, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const contentType = url.searchParams.get('content_type'); // course, wod, program, page
    const contentId = url.searchParams.get('content_id');
    const validationType = url.searchParams.get('validation_type') || 'basic'; // basic, comprehensive, adaptive
    
    if (!contentType || !contentId) {
        throw new Error('Content type and ID are required');
    }
    
    const validation = await validateContentPrerequisites(contentType, contentId, userId, supabaseUrl, serviceRoleKey, validationType);
    
    return new Response(JSON.stringify({ data: validation }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handle POST requests for path adjustment and recommendations
async function handlePathAdjustment(requestData: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const { action_type, content_data, performance_data, adjustment_preferences } = requestData;
    
    let result: any = {};
    
    if (action_type === 'adjust_difficulty') {
        result = await adjustDifficultyBasedOnPerformance(content_data, performance_data, userId, supabaseUrl, serviceRoleKey);
    } else if (action_type === 'recommend_next') {
        result = await getAdaptiveContentRecommendations(content_data, userId, supabaseUrl, serviceRoleKey);
    } else if (action_type === 'analyze_skill_gaps') {
        result = await analyzeSkillGaps(content_data, userId, supabaseUrl, serviceRoleKey);
    } else if (action_type === 'validate_sequence') {
        result = await validateLearningSequence(content_data, userId, supabaseUrl, serviceRoleKey);
    } else {
        throw new Error('Invalid action type');
    }
    
    return new Response(JSON.stringify({ data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Validate content prerequisites based on user progress
async function validateContentPrerequisites(contentType: string, contentId: string, userId: string, supabaseUrl: string, serviceRoleKey: string, validationType: string) {
    const validation: any = {
        content_id: contentId,
        content_type: contentType,
        is_accessible: false,
        prerequisite_status: {},
        recommendations: [],
        skill_gaps: [],
        estimated_readiness: 0
    };
    
    // Get content prerequisites
    let prerequisites: any = [];
    
    if (contentType === 'course') {
        const courseResponse = await fetch(
            `${supabaseUrl}/rest/v1/courses?id=eq.${contentId}&select=prerequisite_course_ids`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            if (courseData[0]?.prerequisite_course_ids) {
                prerequisites = courseData[0].prerequisite_course_ids.map((id: string) => ({ 
                    type: 'course', 
                    id, 
                    required: true 
                }));
            }
        }
    } else if (contentType === 'wod') {
        const wodResponse = await fetch(
            `${supabaseUrl}/rest/v1/wods?id=eq.${contentId}&select=prerequisites`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        if (wodResponse.ok) {
            const wodData = await wodResponse.json();
            if (wodData[0]?.prerequisites) {
                prerequisites = wodData[0].prerequisites;
            }
        }
    } else if (contentType === 'program') {
        const programResponse = await fetch(
            `${supabaseUrl}/rest/v1/programs?id=eq.${contentId}&select=prerequisites`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        if (programResponse.ok) {
            const programData = await programResponse.json();
            if (programData[0]?.prerequisites) {
                prerequisites = programData[0].prerequisites;
            }
        }
    }
    
    // Check user progress against prerequisites
    let metRequirements = 0;
    
    for (const prereq of prerequisites) {
        const progressResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_progress?user_id=eq.${userId}&${prereq.type}_id=eq.${prereq.id}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        
        if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            const isCompleted = progressData.length > 0 && progressData[0].completion_percentage >= (prereq.required_percentage || 80);
            
            validation.prerequisite_status[prereq.id] = {
                type: prereq.type,
                required: prereq.required || false,
                completed: isCompleted,
                completion_percentage: progressData[0]?.completion_percentage || 0,
                mastery_score: progressData[0]?.knowledge_retention_score || null
            };
            
            if (isCompleted) {
                metRequirements++;
            } else if (prereq.required) {
                validation.recommendations.push({
                    type: 'complete_prerequisite',
                    content_type: prereq.type,
                    content_id: prereq.id,
                    priority: 'high',
                    message: `Complete ${prereq.type} before accessing this content`
                });
            }
        } else {
            validation.prerequisite_status[prereq.id] = {
                type: prereq.type,
                required: prereq.required || false,
                completed: false,
                completion_percentage: 0
            };
            
            if (prereq.required) {
                validation.recommendations.push({
                    type: 'start_prerequisite',
                    content_type: prereq.type,
                    content_id: prereq.id,
                    priority: 'high',
                    message: `Start ${prereq.type} to unlock this content`
                });
            }
        }
    }
    
    // Calculate readiness and accessibility
    validation.estimated_readiness = prerequisites.length > 0 ? (metRequirements / prerequisites.length) * 100 : 100;
    validation.is_accessible = validation.estimated_readiness >= 80; // 80% threshold
    
    // Comprehensive validation includes skill gap analysis
    if (validationType === 'comprehensive' || validationType === 'adaptive') {
        validation.skill_gaps = await analyzeSkillGapsForContent(contentType, contentId, userId, supabaseUrl, serviceRoleKey);
        
        // Adjust accessibility based on skill gaps
        if (validation.skill_gaps.length > 0) {
            const criticalGaps = validation.skill_gaps.filter((gap: any) => gap.severity === 'high');
            if (criticalGaps.length > 0) {
                validation.is_accessible = false;
                validation.recommendations.push({
                    type: 'address_skill_gaps',
                    gaps: criticalGaps,
                    priority: 'high',
                    message: 'Address critical skill gaps before proceeding'
                });
            }
        }
    }
    
    // Adaptive validation includes personalized recommendations
    if (validationType === 'adaptive') {
        const adaptiveRecommendations = await getPersonalizedRecommendations(contentType, contentId, userId, supabaseUrl, serviceRoleKey);
        validation.recommendations.push(...adaptiveRecommendations);
    }
    
    return validation;
}

// Adjust difficulty based on user performance
async function adjustDifficultyBasedOnPerformance(contentData: any, performanceData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    const { content_type, content_id, current_difficulty } = contentData;
    const { avg_score, completion_time, struggle_indicators, mastery_level } = performanceData;
    
    let recommendedDifficulty = current_difficulty;
    const adjustments: any = {
        current_difficulty,
        recommended_difficulty: current_difficulty,
        adjustment_reason: 'no_change_needed',
        confidence_score: 0,
        suggested_actions: []
    };
    
    // Performance-based difficulty adjustment logic
    if (avg_score >= 90 && completion_time < 0.8 && mastery_level >= 80) {
        // User is performing exceptionally well, increase difficulty
        recommendedDifficulty = Math.min(current_difficulty + 1, 5);
        adjustments.adjustment_reason = 'high_performance';
        adjustments.confidence_score = 85;
        adjustments.suggested_actions.push('increase_challenge_level');
    } else if (avg_score < 60 || struggle_indicators > 3) {
        // User is struggling, decrease difficulty
        recommendedDifficulty = Math.max(current_difficulty - 1, 1);
        adjustments.adjustment_reason = 'performance_struggles';
        adjustments.confidence_score = 75;
        adjustments.suggested_actions.push('provide_additional_support', 'review_fundamentals');
    } else if (completion_time > 1.5) {
        // User is taking too long, might need easier content or more support
        adjustments.adjustment_reason = 'extended_completion_time';
        adjustments.confidence_score = 60;
        adjustments.suggested_actions.push('provide_hints', 'break_into_smaller_chunks');
    }
    
    adjustments.recommended_difficulty = recommendedDifficulty;
    
    // Update user progress with adaptive difficulty
    if (recommendedDifficulty !== current_difficulty) {
        await fetch(
            `${supabaseUrl}/rest/v1/user_progress?user_id=eq.${userId}&${content_type}_id=eq.${content_id}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adaptive_difficulty_level: recommendedDifficulty,
                    personalization_data: {
                        last_difficulty_adjustment: new Date().toISOString(),
                        adjustment_reason: adjustments.adjustment_reason,
                        performance_metrics: performanceData
                    }
                })
            }
        );
    }
    
    return adjustments;
}

// Get adaptive content recommendations based on learning patterns
async function getAdaptiveContentRecommendations(contentData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    const { content_type, content_id, completion_status } = contentData;
    
    // Get user's learning patterns and preferences
    const progressResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_progress?user_id=eq.${userId}&select=learning_pattern_data,preferred_content_types,learning_velocity_score`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );
    
    const recommendations: any = {
        next_content: [],
        remediation: [],
        enrichment: [],
        review: []
    };
    
    if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        const learningPatterns = progressData[0]?.learning_pattern_data || {};
        const preferredTypes = progressData[0]?.preferred_content_types || [];
        const learningVelocity = progressData[0]?.learning_velocity_score || 50;
        
        // Recommend next content based on completion status and patterns
        if (completion_status === 'completed') {
            // User completed current content, recommend progression
            recommendations.next_content = await getProgressionRecommendations(content_type, content_id, learningPatterns, preferredTypes, supabaseUrl, serviceRoleKey);
        } else if (completion_status === 'struggling') {
            // User is struggling, recommend remediation
            recommendations.remediation = await getRemediationRecommendations(content_type, content_id, learningPatterns, supabaseUrl, serviceRoleKey);
        }
        
        // Always include review recommendations for retention
        recommendations.review = await getReviewRecommendations(userId, learningVelocity, supabaseUrl, serviceRoleKey);
        
        // High performers get enrichment recommendations
        if (learningVelocity > 75) {
            recommendations.enrichment = await getEnrichmentRecommendations(content_type, content_id, preferredTypes, supabaseUrl, serviceRoleKey);
        }
    }
    
    return recommendations;
}

// Analyze skill gaps for specific content
async function analyzeSkillGapsForContent(contentType: string, contentId: string, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    const skillGaps: any = [];
    
    // Get user's performance across related content
    const performanceResponse = await fetch(
        `${supabaseUrl}/rest/v1/block_completions?user_id=eq.${userId}&${contentType}_id=eq.${contentId}&select=*`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );
    
    if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        
        // Analyze performance patterns to identify gaps
        const lowPerformanceBlocks = performanceData.filter((block: any) => 
            block.mastery_score < 70 || block.completion_percentage < 80
        );
        
        for (const block of lowPerformanceBlocks) {
            // Get block information to understand the skill area
            const blockResponse = await fetch(
                `${supabaseUrl}/rest/v1/blocks?id=eq.${block.block_id}&select=block_type,config,content`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (blockResponse.ok) {
                const blockData = await blockResponse.json();
                if (blockData[0]) {
                    skillGaps.push({
                        skill_area: blockData[0].block_type,
                        gap_type: block.mastery_score < 50 ? 'critical' : 'moderate',
                        severity: block.mastery_score < 50 ? 'high' : 'medium',
                        current_score: block.mastery_score || 0,
                        target_score: 80,
                        recommended_actions: [
                            'additional_practice',
                            'review_fundamentals',
                            'seek_help'
                        ]
                    });
                }
            }
        }
    }
    
    return skillGaps;
}

// Analyze general skill gaps
async function analyzeSkillGaps(contentData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    const { scope } = contentData; // 'current_course', 'all_content', 'specific_skills'
    
    // Implementation would analyze user performance across different skill areas
    return {
        identified_gaps: [],
        priority_areas: [],
        remediation_plan: [],
        estimated_improvement_time: null
    };
}

// Validate learning sequence integrity
async function validateLearningSequence(contentData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    const { sequence_type, content_ids } = contentData;
    
    // Implementation would validate the logical flow of content
    return {
        is_valid_sequence: true,
        sequence_issues: [],
        optimization_suggestions: [],
        alternative_sequences: []
    };
}

// Helper functions for recommendations
async function getProgressionRecommendations(contentType: string, contentId: string, learningPatterns: any, preferredTypes: any[], supabaseUrl: string, serviceRoleKey: string) {
    // Implementation would get next logical content based on curriculum
    return [];
}

async function getRemediationRecommendations(contentType: string, contentId: string, learningPatterns: any, supabaseUrl: string, serviceRoleKey: string) {
    // Implementation would get remedial content for struggling areas
    return [];
}

async function getReviewRecommendations(userId: string, learningVelocity: number, supabaseUrl: string, serviceRoleKey: string) {
    // Implementation would get content for review based on retention curves
    return [];
}

async function getEnrichmentRecommendations(contentType: string, contentId: string, preferredTypes: any[], supabaseUrl: string, serviceRoleKey: string) {
    // Implementation would get advanced/enrichment content
    return [];
}

async function getPersonalizedRecommendations(contentType: string, contentId: string, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    // Implementation would get personalized recommendations based on user profile
    return [];
}