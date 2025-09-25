// Advanced Analytics Dashboard Edge Function - Comprehensive learning analytics with predictive insights
// Provides real-time analytics, performance benchmarking, and personalized recommendations

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface AnalyticsRequest {
  clientId?: string
  userId?: string
  dateRange: {
    start: string
    end: string
  }
  metrics: string[]
  analyticsType?: 'dashboard' | 'individual' | 'comparative' | 'predictive'
  benchmarkScope?: 'global' | 'client' | 'peer'
  includeRecommendations?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing')
    }

    // Get user from auth header for personalized analytics
    const authHeader = req.headers.get('authorization')
    let currentUserId: string | null = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': serviceRoleKey
        }
      })
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id
      }
    }

    const requestBody = await req.json()
    
    // Provide default values for missing properties
    const { 
      clientId, 
      userId, 
      dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        end: new Date().toISOString() // now
      }, 
      metrics = ['summary_stats', 'learning_analytics'], // Default metrics
      analyticsType = 'dashboard',
      benchmarkScope = 'client',
      includeRecommendations = false 
    } = requestBody
    
    // Validate metrics is an array
    const validMetrics = Array.isArray(metrics) ? metrics : ['summary_stats', 'learning_analytics']
    
    const analyticsData: any = {}

    // Advanced Learning Analytics
    if (validMetrics.includes('learning_analytics')) {
      const learningAnalytics = await getAdvancedLearningAnalytics(
        supabaseUrl, 
        serviceRoleKey, 
        dateRange, 
        clientId,
        userId || currentUserId
      )
      analyticsData.learningAnalytics = learningAnalytics
    }

    // Performance Benchmarking
    if (validMetrics.includes('performance_benchmarks')) {
      const benchmarks = await getPerformanceBenchmarks(
        supabaseUrl,
        serviceRoleKey,
        benchmarkScope,
        clientId,
        userId || currentUserId
      )
      analyticsData.performanceBenchmarks = benchmarks
    }

    // Learning Velocity and Engagement Metrics
    if (validMetrics.includes('velocity_engagement')) {
      const velocityMetrics = await getLearningVelocityMetrics(
        supabaseUrl,
        serviceRoleKey,
        dateRange,
        clientId,
        userId || currentUserId
      )
      analyticsData.velocityEngagement = velocityMetrics
    }

    // Predictive Analytics
    if (validMetrics.includes('predictive_insights')) {
      const predictiveData = await getPredictiveAnalytics(
        supabaseUrl,
        serviceRoleKey,
        userId || currentUserId,
        clientId
      )
      analyticsData.predictiveInsights = predictiveData
    }

    // At-Risk Learner Identification
    if (validMetrics.includes('at_risk_learners')) {
      const atRiskData = await getAtRiskLearners(
        supabaseUrl,
        serviceRoleKey,
        clientId
      )
      analyticsData.atRiskLearners = atRiskData
    }

    // User Activity Ranking (Enhanced)
    if (validMetrics.includes('user_activity')) {
      const userActivityData = await getEnhancedUserActivity(
        supabaseUrl,
        serviceRoleKey,
        dateRange,
        clientId
      )
      analyticsData.userActivity = userActivityData
    }

    // Recent Activity Log
    if (validMetrics.includes('recent_activity')) {
      let recentUrl = `${supabaseUrl}/rest/v1/user_activities?select=*,users!inner(first_name,last_name),content_items(title)&created_at=gte.${dateRange.start}&created_at=lte.${dateRange.end}&order=created_at.desc&limit=50`
      
      if (clientId && clientId !== 'all') {
        recentUrl += `&client_id=eq.${clientId}`
      }

      const response = await fetch(recentUrl, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const recentActivity = await response.json()
        analyticsData.recentActivity = recentActivity || []
      }
    }

    // Summary Statistics
    if (validMetrics.includes('summary_stats')) {
      // Total users count
      let userCountUrl = `${supabaseUrl}/rest/v1/users?select=*&count=exact&head=true`
      if (clientId && clientId !== 'all') {
        userCountUrl += `&client_id=eq.${clientId}`
      }

      // Total content count
      const contentCountUrl = `${supabaseUrl}/rest/v1/content_items?select=*&status=eq.published&count=exact&head=true`

      // Recent activities count
      let activityCountUrl = `${supabaseUrl}/rest/v1/user_activities?select=*&created_at=gte.${dateRange.start}&created_at=lte.${dateRange.end}&count=exact&head=true`
      if (clientId && clientId !== 'all') {
        activityCountUrl += `&client_id=eq.${clientId}`
      }

      const [usersResponse, contentResponse, activityResponse] = await Promise.all([
        fetch(userCountUrl, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }),
        fetch(contentCountUrl, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }),
        fetch(activityCountUrl, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        })
      ])

      const userCount = parseInt(usersResponse.headers.get('content-range')?.split('/')[1] || '0')
      const contentCount = parseInt(contentResponse.headers.get('content-range')?.split('/')[1] || '0')
      const activityCount = parseInt(activityResponse.headers.get('content-range')?.split('/')[1] || '0')

      analyticsData.summaryStats = {
        totalUsers: userCount,
        totalContent: contentCount,
        recentActivities: activityCount
      }
    }

    // Personalized Recommendations
    if (includeRecommendations && (userId || currentUserId)) {
      const recommendations = await getPersonalizedRecommendations(
        supabaseUrl,
        serviceRoleKey,
        userId || currentUserId!,
        clientId
      )
      analyticsData.personalizedRecommendations = recommendations
    }

    // Content Engagement Analytics
    if (validMetrics.includes('content_engagement')) {
      const engagementData = await getContentEngagementAnalytics(
        supabaseUrl,
        serviceRoleKey,
        dateRange,
        clientId
      )
      analyticsData.contentEngagement = engagementData
    }
    
    // Learning Path Effectiveness
    if (validMetrics.includes('learning_path_effectiveness')) {
      const pathEffectiveness = await getLearningPathEffectiveness(
        supabaseUrl,
        serviceRoleKey,
        dateRange,
        clientId
      )
      analyticsData.learningPathEffectiveness = pathEffectiveness
    }

    // Add computation metadata
    analyticsData.metadata = {
      computedAt: new Date().toISOString(),
      analyticsType,
      benchmarkScope,
      dateRange,
      userId: userId || currentUserId,
      clientId
    }

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Analytics Error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'ADVANCED_ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch advanced analytics data'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper function to get advanced learning analytics (optimized for pre-computed data)
async function getAdvancedLearningAnalytics(
  supabaseUrl: string,
  serviceRoleKey: string,
  dateRange: { start: string, end: string },
  clientId?: string,
  userId?: string
) {
  // Query pre-computed analytics data for optimal performance
  let query = `user_id,client_id,analytics_period,total_learning_time_minutes,active_learning_time_minutes,learning_sessions_count,blocks_attempted,blocks_completed,blocks_mastered,avg_learning_velocity,learning_velocity_trend,content_consumption_rate,avg_engagement_score,avg_focus_score,interaction_intensity,attention_span_minutes,break_frequency,avg_completion_percentage,avg_mastery_score,performance_consistency_score,improvement_rate,retention_score,skill_degradation_risk,knowledge_decay_rate,completion_prediction_score,at_risk_indicator,estimated_time_to_mastery_hours,success_probability,peer_ranking_percentile,cohort_comparison_score,organizational_benchmark_score,time_efficiency_score,effort_efficiency_score,computation_timestamp,data_quality_score`
  
  let url = `${supabaseUrl}/rest/v1/learning_analytics?select=${query}`
  
  // Filter by date range using period boundaries
  url += `&period_start_date=gte.${dateRange.start}&period_end_date=lte.${dateRange.end}`
  
  // Add client and user filters
  if (clientId && clientId !== 'all') {
    url += `&client_id=eq.${clientId}`
  }
  
  if (userId) {
    url += `&user_id=eq.${userId}`
  }
  
  // Order by most recent computation for latest insights
  url += `&order=computation_timestamp.desc`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  })
  
  if (response.ok) {
    const data = await response.json()
    
    // Add computed insights and aggregations
    const analytics = {
      raw_data: data,
      summary: calculateAnalyticsSummary(data),
      insights: generateAnalyticsInsights(data),
      last_computed: data.length > 0 ? data[0].computation_timestamp : null,
      data_freshness: calculateDataFreshness(data)
    }
    
    return analytics
  }
  
  return { raw_data: [], summary: {}, insights: {}, last_computed: null, data_freshness: 'stale' }
}

// Helper function to get performance benchmarks
async function getPerformanceBenchmarks(
  supabaseUrl: string,
  serviceRoleKey: string,
  benchmarkScope: string,
  clientId?: string,
  userId?: string
) {
  let url = `${supabaseUrl}/rest/v1/performance_benchmarks?benchmark_scope=eq.${benchmarkScope}`
  
  if (benchmarkScope === 'client' && clientId) {
    url += `&scope_id=eq.${clientId}`
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  })
  
  if (response.ok) {
    return await response.json()
  }
  
  return []
}

// Helper function to get learning velocity metrics (optimized for pre-computed data)
async function getLearningVelocityMetrics(
  supabaseUrl: string,
  serviceRoleKey: string,
  dateRange: { start: string, end: string },
  clientId?: string,
  userId?: string
) {
  // Query pre-computed learning analytics for velocity metrics
  let query = `user_id,client_id,analytics_period,avg_learning_velocity,learning_velocity_trend,content_consumption_rate,time_efficiency_score,effort_efficiency_score,blocks_completed,blocks_mastered,total_learning_time_minutes,avg_engagement_score,period_start_date,period_end_date`
  
  let url = `${supabaseUrl}/rest/v1/learning_analytics?select=${query}`
  
  // Filter by date range
  url += `&period_start_date=gte.${dateRange.start}&period_end_date=lte.${dateRange.end}`
  
  if (clientId && clientId !== 'all') {
    url += `&client_id=eq.${clientId}`
  }
  
  if (userId) {
    url += `&user_id=eq.${userId}`
  }
  
  url += `&order=computation_timestamp.desc`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  })
  
  
  if (response.ok) {
    const data = await response.json()
    
    // Enhance with additional computed velocity metrics
    const velocityMetrics = data.map((user: any) => ({
      ...user,
      // Calculate blocks per hour from pre-computed data
      blocks_per_hour: user.total_learning_time_minutes > 0 ? 
        (user.blocks_completed / (user.total_learning_time_minutes / 60)) : 0,
      // Calculate engagement velocity
      engagement_velocity: (user.avg_engagement_score || 0) * (user.avg_learning_velocity || 0),
      // Calculate learning efficiency from pre-computed data
      learning_efficiency: user.blocks_completed > 0 ? 
        (user.blocks_mastered / user.blocks_completed) : 0,
      // Add velocity trend analysis
      velocity_trend_score: getVelocityTrendScore(user.learning_velocity_trend),
      // Add efficiency rating
      efficiency_rating: getEfficiencyRating(user.time_efficiency_score, user.effort_efficiency_score)
    }))
    
    return {
      metrics: velocityMetrics,
      summary: calculateVelocityMetricsSummary(velocityMetrics),
      trends: analyzeVelocityTrends(velocityMetrics)
    }
  }
  
  return { metrics: [], summary: {}, trends: {} }
}

// Helper function to get predictive analytics
async function getPredictiveAnalytics(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId?: string,
  clientId?: string
) {
  let url = `${supabaseUrl}/rest/v1/learning_analytics?select=user_id,completion_prediction_score,success_probability,estimated_time_to_mastery_hours,at_risk_indicator,recommended_interventions`
  
  if (clientId && clientId !== 'all') {
    url += `&client_id=eq.${clientId}`
  }
  
  if (userId) {
    url += `&user_id=eq.${userId}`
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  })
  
  if (response.ok) {
    return await response.json()
  }
  
  return []
}

// Helper function to identify at-risk learners
async function getAtRiskLearners(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientId?: string
) {
  let url = `${supabaseUrl}/rest/v1/learning_analytics?select=user_id,at_risk_indicator,skill_degradation_risk,retention_score,improvement_areas,recommended_interventions&at_risk_indicator=eq.true`
  
  if (clientId && clientId !== 'all') {
    url += `&client_id=eq.${clientId}`
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  })
  
  if (response.ok) {
    return await response.json()
  }
  
  return []
}

// Enhanced user activity with learning context
async function getEnhancedUserActivity(
  supabaseUrl: string,
  serviceRoleKey: string,
  dateRange: { start: string, end: string },
  clientId?: string
) {
  let userActivityUrl = `${supabaseUrl}/rest/v1/user_activities?select=user_id,activity_type,created_at,users!inner(first_name,last_name,email)&created_at=gte.${dateRange.start}&created_at=lte.${dateRange.end}`
  
  if (clientId && clientId !== 'all') {
    userActivityUrl += `&client_id=eq.${clientId}`
  }

  const response = await fetch(userActivityUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    const activities = await response.json()
    
    // Process user activity data with learning context
    const activityMap = new Map()
    activities?.forEach((activity: any) => {
      const key = activity.user_id
      const existing = activityMap.get(key)
      if (existing) {
        existing.activity_count += 1
        existing.activity_types.add(activity.activity_type)
      } else {
        activityMap.set(key, {
          user_id: key,
          first_name: activity.users.first_name,
          last_name: activity.users.last_name,
          email: activity.users.email,
          activity_count: 1,
          activity_types: new Set([activity.activity_type]),
          last_activity: activity.created_at
        })
      }
    })
    
    return Array.from(activityMap.values())
      .map((user: any) => ({
        ...user,
        activity_types: Array.from(user.activity_types),
        engagement_diversity: user.activity_types.size
      }))
      .sort((a: any, b: any) => b.activity_count - a.activity_count)
      .slice(0, 20)
  }
  
  return []
}

// Helper function to get personalized recommendations
async function getPersonalizedRecommendations(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  clientId?: string
) {
  const url = `${supabaseUrl}/rest/v1/learning_analytics?select=personalized_recommendations,learning_style_indicators,strength_areas,improvement_areas&user_id=eq.${userId}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  })
  
  if (response.ok) {
    const data = await response.json()
    return data.length > 0 ? data[0] : {}
  }
  
  return {}
}

// Helper function to get content engagement analytics
async function getContentEngagementAnalytics(
  supabaseUrl: string,
  serviceRoleKey: string,
  dateRange: { start: string, end: string },
  clientId?: string
) {
  let url = `${supabaseUrl}/rest/v1/block_completions?select=block_id,content_engagement_score,completion_status,total_time_spent_seconds&created_at=gte.${dateRange.start}&created_at=lte.${dateRange.end}`
  
  if (clientId && clientId !== 'all') {
    url += `&client_id=eq.${clientId}`
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  })
  
  if (response.ok) {
    const data = await response.json()
    
    // Aggregate engagement by block
    const engagementMap = new Map()
    data.forEach((completion: any) => {
      const blockId = completion.block_id
      const existing = engagementMap.get(blockId)
      
      if (existing) {
        existing.total_engagements += 1
        existing.avg_engagement += completion.content_engagement_score || 0
        existing.total_time += completion.total_time_spent_seconds || 0
        if (completion.completion_status === 'completed' || completion.completion_status === 'mastered') {
          existing.completions += 1
        }
      } else {
        engagementMap.set(blockId, {
          block_id: blockId,
          total_engagements: 1,
          avg_engagement: completion.content_engagement_score || 0,
          total_time: completion.total_time_spent_seconds || 0,
          completions: completion.completion_status === 'completed' || completion.completion_status === 'mastered' ? 1 : 0
        })
      }
    })
    
    return Array.from(engagementMap.values())
      .map((block: any) => ({
        ...block,
        avg_engagement: block.avg_engagement / block.total_engagements,
        completion_rate: block.completions / block.total_engagements,
        avg_time_per_engagement: block.total_time / block.total_engagements
      }))
      .sort((a: any, b: any) => b.avg_engagement - a.avg_engagement)
  }
  
  return []
}

// Helper function to get learning path effectiveness
async function getLearningPathEffectiveness(
  supabaseUrl: string,
  serviceRoleKey: string,
  dateRange: { start: string, end: string },
  clientId?: string
) {
  let url = `${supabaseUrl}/rest/v1/user_progress?select=*&updated_at=gte.${dateRange.start}&updated_at=lte.${dateRange.end}`
  
  if (clientId && clientId !== 'all') {
    url += `&client_id=eq.${clientId}`
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  })
  
  if (response.ok) {
    const data = await response.json()
    
    // Analyze learning path effectiveness by content type
    const pathEffectiveness = {
      courses: { total: 0, completed: 0, avg_completion: 0, avg_time: 0 },
      wods: { total: 0, completed: 0, avg_completion: 0, avg_time: 0 },
      programs: { total: 0, completed: 0, avg_completion: 0, avg_time: 0 }
    }
    
    data.forEach((progress: any) => {
      const type = progress.progress_type || 'courses'
      if (pathEffectiveness[type as keyof typeof pathEffectiveness]) {
        const typeData = pathEffectiveness[type as keyof typeof pathEffectiveness]
        typeData.total += 1
        typeData.avg_completion += progress.completion_percentage || 0
        
        if (progress.completion_percentage >= 100) {
          typeData.completed += 1
        }
      }
    })
    
    // Calculate averages
    Object.values(pathEffectiveness).forEach(type => {
      if (type.total > 0) {
        type.avg_completion = type.avg_completion / type.total
        type.completion_rate = type.completed / type.total
      }
    })
    
    return pathEffectiveness
  }
  
  return {}
}

// Helper functions for analytics processing

// Calculate analytics summary from raw data
function calculateAnalyticsSummary(data: any[]): any {
  if (!data || data.length === 0) {
    return {
      totalUsers: 0,
      avgLearningVelocity: 0,
      avgEngagementScore: 0,
      totalLearningTime: 0,
      completionRate: 0,
      atRiskCount: 0
    }
  }

  const totalUsers = data.length
  const avgLearningVelocity = data.reduce((sum, user) => sum + (user.avg_learning_velocity || 0), 0) / totalUsers
  const avgEngagementScore = data.reduce((sum, user) => sum + (user.avg_engagement_score || 0), 0) / totalUsers
  const totalLearningTime = data.reduce((sum, user) => sum + (user.total_learning_time_minutes || 0), 0)
  const completedUsers = data.filter(user => (user.avg_completion_percentage || 0) >= 100).length
  const atRiskUsers = data.filter(user => user.at_risk_indicator === true).length

  return {
    totalUsers,
    avgLearningVelocity: Math.round(avgLearningVelocity * 100) / 100,
    avgEngagementScore: Math.round(avgEngagementScore * 100) / 100,
    totalLearningTime: Math.round(totalLearningTime),
    completionRate: totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) / 100 : 0,
    atRiskCount: atRiskUsers,
    dataFreshness: 'fresh'
  }
}

// Generate insights from analytics data
function generateAnalyticsInsights(data: any[]): any {
  if (!data || data.length === 0) {
    return {
      key_insights: ['No data available for analysis'],
      recommendations: ['Increase user engagement to generate meaningful analytics'],
      performance_trends: 'insufficient_data'
    }
  }

  const insights = []
  const recommendations = []

  // Analyze engagement patterns
  const avgEngagement = data.reduce((sum, user) => sum + (user.avg_engagement_score || 0), 0) / data.length
  if (avgEngagement < 0.5) {
    insights.push('Low engagement levels detected across users')
    recommendations.push('Consider implementing more interactive content and gamification')
  } else if (avgEngagement > 0.8) {
    insights.push('High engagement levels indicate effective learning content')
    recommendations.push('Maintain current engagement strategies and consider scaling')
  }

  // Analyze learning velocity
  const avgVelocity = data.reduce((sum, user) => sum + (user.avg_learning_velocity || 0), 0) / data.length
  if (avgVelocity < 0.3) {
    insights.push('Learning velocity is below optimal levels')
    recommendations.push('Consider breaking content into smaller, more digestible chunks')
  }

  // Analyze at-risk users
  const atRiskCount = data.filter(user => user.at_risk_indicator === true).length
  const atRiskPercentage = (atRiskCount / data.length) * 100
  if (atRiskPercentage > 20) {
    insights.push(`${Math.round(atRiskPercentage)}% of users are at risk of not completing their learning goals`)
    recommendations.push('Implement early intervention strategies for at-risk learners')
  }

  return {
    key_insights: insights,
    recommendations: recommendations,
    performance_trends: avgEngagement > 0.6 && avgVelocity > 0.4 ? 'improving' : 'needs_attention',
    data_quality: data.length > 10 ? 'good' : 'limited'
  }
}

// Calculate data freshness based on computation timestamps
function calculateDataFreshness(data: any[]): string {
  if (!data || data.length === 0) {
    return 'no_data'
  }

  const latestTimestamp = data[0]?.computation_timestamp
  if (!latestTimestamp) {
    return 'unknown'
  }

  const now = new Date()
  const lastComputation = new Date(latestTimestamp)
  const hoursOld = (now.getTime() - lastComputation.getTime()) / (1000 * 60 * 60)

  if (hoursOld < 2) return 'fresh'
  if (hoursOld < 6) return 'recent'
  if (hoursOld < 24) return 'stale'
  return 'outdated'
}

// Get velocity trend score from trend indicator
function getVelocityTrendScore(trendIndicator: string | null): number {
  if (!trendIndicator) return 0
  
  switch (trendIndicator.toLowerCase()) {
    case 'improving':
    case 'increasing':
      return 1
    case 'stable':
    case 'steady':
      return 0
    case 'declining':
    case 'decreasing':
      return -1
    default:
      return 0
  }
}

// Get efficiency rating from time and effort efficiency scores
function getEfficiencyRating(timeEfficiency: number | null, effortEfficiency: number | null): string {
  const timeScore = timeEfficiency || 0
  const effortScore = effortEfficiency || 0
  const combinedScore = (timeScore + effortScore) / 2

  if (combinedScore >= 0.8) return 'excellent'
  if (combinedScore >= 0.6) return 'good'
  if (combinedScore >= 0.4) return 'fair'
  return 'needs_improvement'
}

// Calculate summary of velocity metrics
function calculateVelocityMetricsSummary(velocityData: any[]): any {
  if (!velocityData || velocityData.length === 0) {
    return {
      totalUsers: 0,
      avgVelocity: 0,
      avgEngagementVelocity: 0,
      topPerformerCount: 0,
      improvingUsersCount: 0
    }
  }

  const totalUsers = velocityData.length
  const avgVelocity = velocityData.reduce((sum, user) => sum + (user.avg_learning_velocity || 0), 0) / totalUsers
  const avgEngagementVelocity = velocityData.reduce((sum, user) => sum + (user.engagement_velocity || 0), 0) / totalUsers
  const topPerformers = velocityData.filter(user => (user.avg_learning_velocity || 0) > 0.8).length
  const improvingUsers = velocityData.filter(user => user.velocity_trend_score > 0).length

  return {
    totalUsers,
    avgVelocity: Math.round(avgVelocity * 100) / 100,
    avgEngagementVelocity: Math.round(avgEngagementVelocity * 100) / 100,
    topPerformerCount: topPerformers,
    improvingUsersCount: improvingUsers,
    improvementRate: totalUsers > 0 ? Math.round((improvingUsers / totalUsers) * 100) / 100 : 0
  }
}

// Analyze velocity trends across users
function analyzeVelocityTrends(velocityData: any[]): any {
  if (!velocityData || velocityData.length === 0) {
    return {
      overall_trend: 'insufficient_data',
      trend_distribution: { improving: 0, stable: 0, declining: 0 },
      velocity_patterns: []
    }
  }

  let improving = 0
  let stable = 0
  let declining = 0

  velocityData.forEach(user => {
    const trendScore = user.velocity_trend_score || 0
    if (trendScore > 0) improving++
    else if (trendScore < 0) declining++
    else stable++
  })

  const total = velocityData.length
  const improvingPercent = (improving / total) * 100
  const decliningPercent = (declining / total) * 100

  let overallTrend = 'stable'
  if (improvingPercent > 60) overallTrend = 'improving'
  else if (decliningPercent > 40) overallTrend = 'declining'

  // Identify velocity patterns
  const patterns = []
  if (improvingPercent > 50) {
    patterns.push('Majority of users showing velocity improvement')
  }
  if (decliningPercent > 30) {
    patterns.push('Significant portion of users experiencing velocity decline')
  }
  
  const highVelocityUsers = velocityData.filter(user => (user.avg_learning_velocity || 0) > 0.7).length
  const highVelocityPercent = (highVelocityUsers / total) * 100
  
  if (highVelocityPercent > 25) {
    patterns.push('Strong cohort of high-velocity learners identified')
  }

  return {
    overall_trend: overallTrend,
    trend_distribution: {
      improving: Math.round(improvingPercent),
      stable: Math.round((stable / total) * 100),
      declining: Math.round(decliningPercent)
    },
    velocity_patterns: patterns,
    high_velocity_users: highVelocityUsers
  }
}