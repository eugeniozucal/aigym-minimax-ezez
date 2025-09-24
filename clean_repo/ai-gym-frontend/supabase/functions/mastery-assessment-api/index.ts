// Mastery Assessment API - Multi-dimensional competency tracking and knowledge retention
// Provides comprehensive mastery evaluation with skill degradation detection and retention analysis

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
            return await handleGetMasteryAssessment(url, userId, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (method === 'POST') {
            const requestData = await req.json();
            return await handleMasteryEvaluation(requestData, userId, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (method === 'PUT') {
            const requestData = await req.json();
            return await handleMasteryUpdate(requestData, userId, supabaseUrl, serviceRoleKey, corsHeaders);
        }

        throw new Error('Method not supported');

    } catch (error) {
        console.error('Mastery assessment error:', error);

        const errorResponse = {
            error: {
                code: 'MASTERY_ASSESSMENT_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Handle GET requests for mastery assessments
async function handleGetMasteryAssessment(url: URL, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const assessmentType = url.searchParams.get('type') || 'current'; // current, historical, predictive, comprehensive
    const contentId = url.searchParams.get('content_id');
    const contentType = url.searchParams.get('content_type');
    const skillArea = url.searchParams.get('skill_area');
    const timeframe = url.searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, all
    
    let assessment: any = {};
    
    if (assessmentType === 'current') {
        assessment = await getCurrentMasteryLevels(userId, contentId, contentType, skillArea, supabaseUrl, serviceRoleKey);
    } else if (assessmentType === 'historical') {
        assessment = await getHistoricalMasteryTrends(userId, contentId, contentType, timeframe, supabaseUrl, serviceRoleKey);
    } else if (assessmentType === 'predictive') {
        assessment = await getPredictiveMasteryAnalysis(userId, contentId, contentType, supabaseUrl, serviceRoleKey);
    } else if (assessmentType === 'comprehensive') {
        assessment = await getComprehensiveMasteryReport(userId, contentId, contentType, supabaseUrl, serviceRoleKey);
    } else if (assessmentType === 'retention') {
        assessment = await getRetentionAnalysis(userId, contentId, contentType, timeframe, supabaseUrl, serviceRoleKey);
    } else if (assessmentType === 'degradation_risk') {
        assessment = await getSkillDegradationRisk(userId, contentId, contentType, supabaseUrl, serviceRoleKey);
    }
    
    return new Response(JSON.stringify({ data: assessment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handle POST requests for mastery evaluation
async function handleMasteryEvaluation(requestData: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const { evaluation_type, content_data, performance_data, assessment_criteria } = requestData;
    
    let result: any = {};
    
    if (evaluation_type === 'assess_competency') {
        result = await assessCompetencyLevels(content_data, performance_data, userId, supabaseUrl, serviceRoleKey);
    } else if (evaluation_type === 'evaluate_retention') {
        result = await evaluateKnowledgeRetention(content_data, performance_data, userId, supabaseUrl, serviceRoleKey);
    } else if (evaluation_type === 'predict_success') {
        result = await predictLearningSuccess(content_data, performance_data, userId, supabaseUrl, serviceRoleKey);
    } else if (evaluation_type === 'analyze_patterns') {
        result = await analyzeMasteryPatterns(content_data, userId, supabaseUrl, serviceRoleKey);
    } else {
        throw new Error('Invalid evaluation type');
    }
    
    return new Response(JSON.stringify({ data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handle PUT requests for mastery updates
async function handleMasteryUpdate(requestData: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const { update_type, mastery_data, recalculate_all } = requestData;
    
    let result: any = {};
    
    if (update_type === 'refresh_scores') {
        result = await refreshMasteryScores(mastery_data, userId, supabaseUrl, serviceRoleKey);
    } else if (update_type === 'update_retention') {
        result = await updateRetentionScores(mastery_data, userId, supabaseUrl, serviceRoleKey);
    } else if (update_type === 'recalculate_predictions') {
        result = await recalculateMasteryPredictions(userId, supabaseUrl, serviceRoleKey);
    }
    
    return new Response(JSON.stringify({ data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Get current mastery levels for user
async function getCurrentMasteryLevels(userId: string, contentId?: string, contentType?: string, skillArea?: string, supabaseUrl: string, serviceRoleKey: string) {
    const mastery: any = {
        user_id: userId,
        overall_mastery_score: 0,
        skill_area_scores: {},
        content_mastery: {},
        competency_levels: {},
        last_assessment_date: new Date().toISOString()
    };
    
    // Get block completions with mastery data
    let blockQuery = `user_id=eq.${userId}`;
    if (contentId && contentType) {
        blockQuery += `&${contentType}_id=eq.${contentId}`;
    }
    
    const blockResponse = await fetch(
        `${supabaseUrl}/rest/v1/block_completions?${blockQuery}&select=*`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );
    
    if (blockResponse.ok) {
        const blockData = await blockResponse.json();
        
        // Calculate mastery scores by skill area
        const skillScores: any = {};
        const blockTypes: any = {};
        
        for (const block of blockData) {
            // Get block type information
            const blockInfoResponse = await fetch(
                `${supabaseUrl}/rest/v1/blocks?id=eq.${block.block_id}&select=block_type,config`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            
            if (blockInfoResponse.ok) {
                const blockInfo = await blockInfoResponse.json();
                if (blockInfo[0]) {
                    const blockType = blockInfo[0].block_type;
                    
                    if (!skillScores[blockType]) {
                        skillScores[blockType] = {
                            total_score: 0,
                            count: 0,
                            mastered_blocks: 0,
                            avg_mastery: 0
                        };
                    }
                    
                    skillScores[blockType].total_score += block.mastery_score || 0;
                    skillScores[blockType].count += 1;
                    
                    if (block.is_mastered) {
                        skillScores[blockType].mastered_blocks += 1;
                    }
                }
            }
        }
        
        // Calculate averages and competency levels
        let totalMastery = 0;
        let skillCount = 0;
        
        for (const [skill, data] of Object.entries(skillScores)) {
            const skillData = data as any;
            skillData.avg_mastery = skillData.count > 0 ? skillData.total_score / skillData.count : 0;
            skillData.competency_level = getCompetencyLevel(skillData.avg_mastery);
            
            mastery.skill_area_scores[skill] = skillData;
            totalMastery += skillData.avg_mastery;
            skillCount += 1;
        }
        
        mastery.overall_mastery_score = skillCount > 0 ? totalMastery / skillCount : 0;
        mastery.competency_levels = await calculateCompetencyLevels(blockData, userId, supabaseUrl, serviceRoleKey);
    }
    
    // Get enhanced progress data
    let progressQuery = `user_id=eq.${userId}`;
    if (contentId && contentType) {
        progressQuery += `&${contentType}_id=eq.${contentId}`;
    }
    
    const progressResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_progress?${progressQuery}&select=knowledge_retention_score,mastery_prediction_score,skill_degradation_risk`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );
    
    if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        if (progressData.length > 0) {
            mastery.knowledge_retention = progressData[0].knowledge_retention_score || 0;
            mastery.mastery_prediction = progressData[0].mastery_prediction_score || 0;
            mastery.degradation_risk = progressData[0].skill_degradation_risk || 0;
        }
    }
    
    return mastery;
}

// Get historical mastery trends
async function getHistoricalMasteryTrends(userId: string, contentId?: string, contentType?: string, timeframe: string, supabaseUrl: string, serviceRoleKey: string) {
    const trends: any = {
        user_id: userId,
        timeframe,
        mastery_progression: [],
        skill_development: {},
        performance_trends: {},
        retention_trends: []
    };
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
        default:
            startDate = new Date('2020-01-01'); // All time
    }
    
    // Get historical block completions
    let blockQuery = `user_id=eq.${userId}&updated_at=gte.${startDate.toISOString()}`;
    if (contentId && contentType) {
        blockQuery += `&${contentType}_id=eq.${contentId}`;
    }
    
    const blockResponse = await fetch(
        `${supabaseUrl}/rest/v1/block_completions?${blockQuery}&order=updated_at.asc&select=*`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );
    
    if (blockResponse.ok) {
        const blockData = await blockResponse.json();
        
        // Group by time periods for trend analysis
        const timePeriods: any = {};
        
        for (const block of blockData) {
            const date = new Date(block.updated_at).toISOString().split('T')[0]; // Group by day
            
            if (!timePeriods[date]) {
                timePeriods[date] = {
                    date,
                    mastery_scores: [],
                    completion_count: 0,
                    avg_mastery: 0
                };
            }
            
            timePeriods[date].mastery_scores.push(block.mastery_score || 0);
            timePeriods[date].completion_count += 1;
        }
        
        // Calculate averages for each time period
        for (const [date, data] of Object.entries(timePeriods)) {
            const periodData = data as any;
            periodData.avg_mastery = periodData.mastery_scores.reduce((sum: number, score: number) => sum + score, 0) / periodData.mastery_scores.length;
            trends.mastery_progression.push(periodData);
        }
    }
    
    return trends;
}

// Get predictive mastery analysis
async function getPredictiveMasteryAnalysis(userId: string, contentId?: string, contentType?: string, supabaseUrl: string, serviceRoleKey: string) {
    const prediction: any = {
        user_id: userId,
        prediction_confidence: 0,
        estimated_mastery_timeline: {},
        success_probability: 0,
        recommended_actions: [],
        risk_factors: [],
        completion_predictions: {}
    };
    
    // Get user's learning velocity and patterns
    const progressResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_progress?user_id=eq.${userId}&select=learning_velocity_score,engagement_quality_score,knowledge_retention_score,learning_pattern_data`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        }
    );
    
    if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        
        if (progressData.length > 0) {
            const userProgress = progressData[0];
            const learningVelocity = userProgress.learning_velocity_score || 50;
            const engagementQuality = userProgress.engagement_quality_score || 50;
            const knowledgeRetention = userProgress.knowledge_retention_score || 50;
            
            // Calculate success probability based on current metrics
            prediction.success_probability = calculateSuccessProbability(learningVelocity, engagementQuality, knowledgeRetention);
            
            // Predict mastery timeline based on current velocity
            if (contentId && contentType) {
                prediction.estimated_mastery_timeline = await predictMasteryTimeline(contentId, contentType, learningVelocity, userId, supabaseUrl, serviceRoleKey);
            }
            
            // Identify risk factors
            if (learningVelocity < 40) {
                prediction.risk_factors.push({
                    factor: 'low_learning_velocity',
                    severity: 'medium',
                    impact: 'May require additional time to achieve mastery'
                });
            }
            
            if (engagementQuality < 50) {
                prediction.risk_factors.push({
                    factor: 'low_engagement',
                    severity: 'high',
                    impact: 'Risk of incomplete learning and poor retention'
                });
            }
            
            if (knowledgeRetention < 60) {
                prediction.risk_factors.push({
                    factor: 'poor_retention',
                    severity: 'high',
                    impact: 'May lose previously learned skills over time'
                });
            }
            
            // Generate recommendations
            prediction.recommended_actions = generateMasteryRecommendations(learningVelocity, engagementQuality, knowledgeRetention);
            
            // Set prediction confidence based on data quality
            prediction.prediction_confidence = calculatePredictionConfidence(progressData.length, learningVelocity, engagementQuality);
        }
    }
    
    return prediction;
}

// Get comprehensive mastery report
async function getComprehensiveMasteryReport(userId: string, contentId?: string, contentType?: string, supabaseUrl: string, serviceRoleKey: string) {
    const report: any = {
        user_id: userId,
        report_generated_at: new Date().toISOString(),
        current_mastery: {},
        historical_trends: {},
        predictive_analysis: {},
        retention_analysis: {},
        skill_gaps: [],
        recommendations: [],
        action_plan: {}
    };
    
    // Compile all mastery data
    report.current_mastery = await getCurrentMasteryLevels(userId, contentId, contentType, undefined, supabaseUrl, serviceRoleKey);
    report.historical_trends = await getHistoricalMasteryTrends(userId, contentId, contentType, '90d', supabaseUrl, serviceRoleKey);
    report.predictive_analysis = await getPredictiveMasteryAnalysis(userId, contentId, contentType, supabaseUrl, serviceRoleKey);
    report.retention_analysis = await getRetentionAnalysis(userId, contentId, contentType, '30d', supabaseUrl, serviceRoleKey);
    
    // Generate comprehensive recommendations
    report.recommendations = await generateComprehensiveRecommendations(report, userId, supabaseUrl, serviceRoleKey);
    
    return report;
}

// Additional helper functions
function getCompetencyLevel(masteryScore: number): string {
    if (masteryScore >= 90) return 'expert';
    if (masteryScore >= 80) return 'proficient';
    if (masteryScore >= 70) return 'competent';
    if (masteryScore >= 60) return 'developing';
    return 'beginner';
}

function calculateSuccessProbability(velocity: number, engagement: number, retention: number): number {
    return (velocity * 0.3 + engagement * 0.4 + retention * 0.3);
}

function calculatePredictionConfidence(dataPoints: number, velocity: number, engagement: number): number {
    const dataConfidence = Math.min(dataPoints * 10, 100); // More data = higher confidence
    const metricConfidence = (velocity + engagement) / 2;
    return (dataConfidence * 0.6 + metricConfidence * 0.4);
}

function generateMasteryRecommendations(velocity: number, engagement: number, retention: number): any[] {
    const recommendations = [];
    
    if (velocity < 50) {
        recommendations.push({
            type: 'improve_velocity',
            priority: 'medium',
            action: 'Break content into smaller chunks and increase practice frequency'
        });
    }
    
    if (engagement < 50) {
        recommendations.push({
            type: 'improve_engagement',
            priority: 'high',
            action: 'Try different content formats and interactive exercises'
        });
    }
    
    if (retention < 60) {
        recommendations.push({
            type: 'improve_retention',
            priority: 'high',
            action: 'Implement spaced repetition and regular review sessions'
        });
    }
    
    return recommendations;
}

// Placeholder functions for complex operations
async function calculateCompetencyLevels(blockData: any[], userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return {};
}

async function getRetentionAnalysis(userId: string, contentId?: string, contentType?: string, timeframe?: string, supabaseUrl?: string, serviceRoleKey?: string) {
    return { retention_score: 0, decay_rate: 0, recommendations: [] };
}

async function getSkillDegradationRisk(userId: string, contentId?: string, contentType?: string, supabaseUrl?: string, serviceRoleKey?: string) {
    return { risk_level: 'low', factors: [], mitigation_strategies: [] };
}

async function assessCompetencyLevels(contentData: any, performanceData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return { competency_scores: {}, overall_level: 'developing' };
}

async function evaluateKnowledgeRetention(contentData: any, performanceData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return { retention_score: 0, improvement_areas: [] };
}

async function predictLearningSuccess(contentData: any, performanceData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return { success_probability: 0, timeline_estimate: null };
}

async function analyzeMasteryPatterns(contentData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return { patterns: [], insights: [] };
}

async function refreshMasteryScores(masteryData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return { updated_scores: {}, recalculation_summary: {} };
}

async function updateRetentionScores(masteryData: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return { updated_retention: {}, recommendations: [] };
}

async function recalculateMasteryPredictions(userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return { updated_predictions: {}, accuracy_metrics: {} };
}

async function predictMasteryTimeline(contentId: string, contentType: string, learningVelocity: number, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return { estimated_completion: null, milestones: [] };
}

async function generateComprehensiveRecommendations(report: any, userId: string, supabaseUrl: string, serviceRoleKey: string) {
    return [];
}