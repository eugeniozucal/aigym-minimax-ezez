// Analytics Computation Cron Job - Scheduled background analytics processing
// Pre-calculates learning analytics and performance benchmarks for optimal dashboard performance

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface ComputationRequest {
  computationType: 'daily' | 'weekly' | 'monthly' | 'benchmarks' | 'all'
  clientId?: string
  userId?: string
  forceRecalculation?: boolean
  batchSize?: number
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

    const {
      computationType = 'daily',
      clientId,
      userId,
      forceRecalculation = false,
      batchSize = 100
    }: ComputationRequest = await req.json().catch(() => ({ computationType: 'daily' }))

    console.log(`Starting analytics computation: ${computationType}`)
    
    // Log the start of computation
    const computationLogId = await logComputationStart(
      supabaseUrl,
      serviceRoleKey,
      computationType,
      clientId,
      userId
    )

    let results: any = {}
    const startTime = Date.now()

    try {
      switch (computationType) {
        case 'daily':
          results = await computeDailyAnalytics(
            supabaseUrl,
            serviceRoleKey,
            clientId,
            userId,
            batchSize,
            forceRecalculation
          )
          break
          
        case 'weekly':
          results = await computeWeeklyAnalytics(
            supabaseUrl,
            serviceRoleKey,
            clientId,
            userId,
            batchSize,
            forceRecalculation
          )
          break
          
        case 'monthly':
          results = await computeMonthlyAnalytics(
            supabaseUrl,
            serviceRoleKey,
            clientId,
            userId,
            batchSize,
            forceRecalculation
          )
          break
          
        case 'benchmarks':
          results = await computePerformanceBenchmarks(
            supabaseUrl,
            serviceRoleKey,
            clientId,
            batchSize
          )
          break
          
        case 'all':
          results = await computeAllAnalytics(
            supabaseUrl,
            serviceRoleKey,
            clientId,
            userId,
            batchSize,
            forceRecalculation
          )
          break
          
        default:
          throw new Error(`Unknown computation type: ${computationType}`)
      }

      const duration = Math.floor((Date.now() - startTime) / 1000)
      
      // Log successful completion
      await logComputationComplete(
        supabaseUrl,
        serviceRoleKey,
        computationLogId,
        results,
        duration
      )

      console.log(`Analytics computation completed in ${duration}s:`, results)

      return new Response(JSON.stringify({
        success: true,
        computationType,
        results,
        duration,
        computationLogId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000)
      
      // Log error
      await logComputationError(
        supabaseUrl,
        serviceRoleKey,
        computationLogId,
        error,
        duration
      )
      
      throw error
    }

  } catch (error) {
    console.error('Analytics Computation Error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'ANALYTICS_COMPUTATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to compute analytics'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Compute daily analytics for all users
async function computeDailyAnalytics(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientId?: string,
  userId?: string,
  batchSize: number = 100,
  forceRecalculation: boolean = false
) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const periodStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  const periodEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  return await computeAnalyticsForPeriod(
    supabaseUrl,
    serviceRoleKey,
    'daily',
    periodStart,
    periodEnd,
    clientId,
    userId,
    batchSize,
    forceRecalculation
  )
}

// Compute weekly analytics
async function computeWeeklyAnalytics(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientId?: string,
  userId?: string,
  batchSize: number = 100,
  forceRecalculation: boolean = false
) {
  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  
  const periodStart = new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate())
  const periodEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  return await computeAnalyticsForPeriod(
    supabaseUrl,
    serviceRoleKey,
    'weekly',
    periodStart,
    periodEnd,
    clientId,
    userId,
    batchSize,
    forceRecalculation
  )
}

// Compute monthly analytics
async function computeMonthlyAnalytics(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientId?: string,
  userId?: string,
  batchSize: number = 100,
  forceRecalculation: boolean = false
) {
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  return await computeAnalyticsForPeriod(
    supabaseUrl,
    serviceRoleKey,
    'monthly',
    lastMonth,
    thisMonth,
    clientId,
    userId,
    batchSize,
    forceRecalculation
  )
}

// Main analytics computation function for a given period
async function computeAnalyticsForPeriod(
  supabaseUrl: string,
  serviceRoleKey: string,
  period: string,
  periodStart: Date,
  periodEnd: Date,
  clientId?: string,
  userId?: string,
  batchSize: number = 100,
  forceRecalculation: boolean = false
) {
  const results = {
    usersProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    errors: 0,
    batches: 0
  }

  // Get list of users to process
  const users = await getUsersForAnalytics(
    supabaseUrl,
    serviceRoleKey,
    clientId,
    userId,
    periodStart,
    periodEnd
  )

  console.log(`Processing ${users.length} users for ${period} analytics`)

  // Process users in batches
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)
    results.batches++
    
    console.log(`Processing batch ${results.batches}: ${batch.length} users`)
    
    const batchPromises = batch.map(user => 
      computeUserAnalytics(
        supabaseUrl,
        serviceRoleKey,
        user,
        period,
        periodStart,
        periodEnd,
        forceRecalculation
      )
    )
    
    const batchResults = await Promise.allSettled(batchPromises)
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.usersProcessed++
        if (result.value.created) results.recordsCreated++
        if (result.value.updated) results.recordsUpdated++
      } else {
        results.errors++
        console.error(`Error processing user ${batch[index].user_id}:`, result.reason)
      }
    })
    
    // Small delay between batches to avoid overwhelming the database
    if (i + batchSize < users.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

// Get users for analytics computation
async function getUsersForAnalytics(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientId?: string,
  userId?: string,
  periodStart?: Date,
  periodEnd?: Date
) {
  let query = 'user_id,client_id'
  let url = `${supabaseUrl}/rest/v1/users?select=${query}`
  
  if (clientId && clientId !== 'all') {
    url += `&client_id=eq.${clientId}`
  }
  
  if (userId) {
    url += `&id=eq.${userId}`
  }
  
  // Only include users who have activity in the period
  if (periodStart && periodEnd) {
    const activityUrl = `${supabaseUrl}/rest/v1/user_activities?select=user_id&created_at=gte.${periodStart.toISOString()}&created_at=lt.${periodEnd.toISOString()}`
    
    const activityResponse = await fetch(activityUrl, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    })
    
    if (activityResponse.ok) {
      const activities = await activityResponse.json()
      const activeUserIds = [...new Set(activities.map((a: any) => a.user_id))]
      
      if (activeUserIds.length > 0) {
        url += `&id=in.(${activeUserIds.join(',')})`
      } else {
        return [] // No active users in this period
      }
    }
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })
  
  if (response.ok) {
    const users = await response.json()
    return users.map((u: any) => ({ user_id: u.user_id || u.id, client_id: u.client_id }))
  }
  
  return []
}

// Compute analytics for a single user
async function computeUserAnalytics(
  supabaseUrl: string,
  serviceRoleKey: string,
  user: { user_id: string, client_id: string },
  period: string,
  periodStart: Date,
  periodEnd: Date,
  forceRecalculation: boolean = false
) {
  // Check if analytics already exist for this period
  if (!forceRecalculation) {
    const existingUrl = `${supabaseUrl}/rest/v1/learning_analytics?user_id=eq.${user.user_id}&analytics_period=eq.${period}&period_start_date=eq.${periodStart.toISOString()}&select=id`
    
    const existingResponse = await fetch(existingUrl, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    })
    
    if (existingResponse.ok) {
      const existing = await existingResponse.json()
      if (existing.length > 0) {
        return { created: false, updated: false, skipped: true }
      }
    }
  }
  
  // Get user's analytics data for the period
  const analyticsData = await getUserAnalyticsData(
    supabaseUrl,
    serviceRoleKey,
    user.user_id,
    user.client_id,
    periodStart,
    periodEnd
  )
  
  // Calculate derived metrics
  const computedAnalytics = calculateDerivedMetrics(analyticsData, period)
  
  // Upsert the analytics record
  const analyticsRecord = {
    user_id: user.user_id,
    client_id: user.client_id,
    analytics_period: period,
    period_start_date: periodStart.toISOString(),
    period_end_date: periodEnd.toISOString(),
    ...computedAnalytics,
    computation_timestamp: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }
  
  const upsertUrl = `${supabaseUrl}/rest/v1/learning_analytics`
  const upsertResponse = await fetch(upsertUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(analyticsRecord)
  })
  
  if (!upsertResponse.ok) {
    const errorText = await upsertResponse.text()
    throw new Error(`Failed to upsert analytics for user ${user.user_id}: ${errorText}`)
  }
  
  return { created: true, updated: false }
}

// Get user's raw analytics data for computation
async function getUserAnalyticsData(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  clientId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const data: any = {
    userId,
    clientId,
    periodStart,
    periodEnd
  }
  
  // Get block completions
  const blockCompletionsUrl = `${supabaseUrl}/rest/v1/block_completions?user_id=eq.${userId}&created_at=gte.${periodStart.toISOString()}&created_at=lt.${periodEnd.toISOString()}&select=*`
  const blockResponse = await fetch(blockCompletionsUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })
  
  if (blockResponse.ok) {
    data.blockCompletions = await blockResponse.json()
  } else {
    data.blockCompletions = []
  }
  
  // Get learning sessions
  const learningSessionsUrl = `${supabaseUrl}/rest/v1/learning_sessions?user_id=eq.${userId}&started_at=gte.${periodStart.toISOString()}&started_at=lt.${periodEnd.toISOString()}&select=*`
  const sessionsResponse = await fetch(learningSessionsUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })
  
  if (sessionsResponse.ok) {
    data.learningSessions = await sessionsResponse.json()
  } else {
    data.learningSessions = []
  }
  
  // Get performance history
  const performanceHistoryUrl = `${supabaseUrl}/rest/v1/performance_history?user_id=eq.${userId}&completed_at=gte.${periodStart.toISOString()}&completed_at=lt.${periodEnd.toISOString()}&select=*`
  const performanceResponse = await fetch(performanceHistoryUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })
  
  if (performanceResponse.ok) {
    data.performanceHistory = await performanceResponse.json()
  } else {
    data.performanceHistory = []
  }
  
  // Get user activities
  const userActivitiesUrl = `${supabaseUrl}/rest/v1/user_activities?user_id=eq.${userId}&created_at=gte.${periodStart.toISOString()}&created_at=lt.${periodEnd.toISOString()}&select=*`
  const activitiesResponse = await fetch(userActivitiesUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })
  
  if (activitiesResponse.ok) {
    data.userActivities = await activitiesResponse.json()
  } else {
    data.userActivities = []
  }
  
  return data
}

// Calculate derived metrics from raw data
function calculateDerivedMetrics(data: any, period: string) {
  const blocks = data.blockCompletions || []
  const sessions = data.learningSessions || []
  const performance = data.performanceHistory || []
  const activities = data.userActivities || []
  
  // Basic counts and totals
  const totalLearningTimeMinutes = sessions.reduce((sum: number, s: any) => 
    sum + ((s.total_duration_seconds || 0) / 60), 0)
  const activeLearningTimeMinutes = sessions.reduce((sum: number, s: any) => 
    sum + ((s.active_duration_seconds || 0) / 60), 0)
  const learningSessionsCount = sessions.length
  const blocksAttempted = blocks.length
  const blocksCompleted = blocks.filter((b: any) => 
    b.completion_status === 'completed' || b.completion_status === 'mastered').length
  const blocksMastered = blocks.filter((b: any) => 
    b.completion_status === 'mastered').length
  
  // Learning velocity and engagement
  const avgLearningVelocity = sessions.length > 0 ?
    sessions.reduce((sum: number, s: any) => sum + (s.learning_velocity || 0), 0) / sessions.length : 0
  const avgEngagementScore = blocks.length > 0 ?
    blocks.reduce((sum: number, b: any) => sum + (b.content_engagement_score || 0), 0) / blocks.length : 0
  const avgFocusScore = sessions.length > 0 ?
    sessions.reduce((sum: number, s: any) => sum + (s.focus_score || 0), 0) / sessions.length : 0
  
  // Performance metrics
  const avgCompletionPercentage = blocks.length > 0 ?
    blocks.reduce((sum: number, b: any) => sum + (b.completion_percentage || 0), 0) / blocks.length : 0
  const avgMasteryScore = blocks.filter((b: any) => b.mastery_score).length > 0 ?
    blocks.reduce((sum: number, b: any) => sum + (b.mastery_score || 0), 0) / blocks.filter((b: any) => b.mastery_score).length : 0
  
  // Learning velocity trend
  let learningVelocityTrend = 'stable'
  if (sessions.length >= 2) {
    const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2))
    const secondHalf = sessions.slice(Math.floor(sessions.length / 2))
    
    const firstHalfAvg = firstHalf.reduce((sum: number, s: any) => sum + (s.learning_velocity || 0), 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum: number, s: any) => sum + (s.learning_velocity || 0), 0) / secondHalf.length
    
    if (secondHalfAvg > firstHalfAvg * 1.1) {
      learningVelocityTrend = 'improving'
    } else if (secondHalfAvg < firstHalfAvg * 0.9) {
      learningVelocityTrend = 'declining'
    }
  }
  
  // Content consumption rate (blocks per hour)
  const contentConsumptionRate = totalLearningTimeMinutes > 0 ?
    (blocksCompleted / (totalLearningTimeMinutes / 60)) : 0
  
  // Attention span and break frequency
  const attentionSpanMinutes = sessions.length > 0 ?
    sessions.reduce((sum: number, s: any) => sum + (s.attention_span_minutes || 0), 0) / sessions.length : 0
  const breakFrequency = totalLearningTimeMinutes > 0 ?
    sessions.reduce((sum: number, s: any) => sum + (s.break_count || 0), 0) / (totalLearningTimeMinutes / 60) : 0
  
  // Performance consistency
  const performanceConsistencyScore = calculateConsistencyScore(blocks)
  
  // Improvement rate
  const improvementRate = performance.length > 0 ?
    (performance.filter((p: any) => p.is_improvement).length / performance.length) * 100 : 0
  
  // At-risk indicator (multiple factors)
  const atRiskIndicator = (
    avgEngagementScore < 50 ||
    avgFocusScore < 50 ||
    (blocksAttempted > 0 && (blocksCompleted / blocksAttempted) < 0.3) ||
    learningVelocityTrend === 'declining'
  )
  
  // Success probability (simple heuristic)
  const successProbability = Math.min(100, Math.max(0, 
    (avgEngagementScore * 0.3) + 
    (avgFocusScore * 0.3) + 
    ((blocksCompleted / Math.max(blocksAttempted, 1)) * 40)
  ))
  
  // Return computed metrics
  return {
    total_learning_time_minutes: Math.round(totalLearningTimeMinutes),
    active_learning_time_minutes: Math.round(activeLearningTimeMinutes),
    learning_sessions_count: learningSessionsCount,
    blocks_attempted: blocksAttempted,
    blocks_completed: blocksCompleted,
    blocks_mastered: blocksMastered,
    avg_learning_velocity: Number(avgLearningVelocity.toFixed(2)),
    learning_velocity_trend: learningVelocityTrend,
    content_consumption_rate: Number(contentConsumptionRate.toFixed(2)),
    avg_engagement_score: Number(avgEngagementScore.toFixed(2)),
    avg_focus_score: Number(avgFocusScore.toFixed(2)),
    attention_span_minutes: Math.round(attentionSpanMinutes),
    break_frequency: Number(breakFrequency.toFixed(2)),
    avg_completion_percentage: Number(avgCompletionPercentage.toFixed(2)),
    avg_mastery_score: Number(avgMasteryScore.toFixed(2)),
    performance_consistency_score: Number(performanceConsistencyScore.toFixed(2)),
    improvement_rate: Number(improvementRate.toFixed(2)),
    at_risk_indicator: atRiskIndicator,
    success_probability: Number(successProbability.toFixed(2)),
    data_quality_score: calculateDataQualityScore(data)
  }
}

// Calculate performance consistency score
function calculateConsistencyScore(blocks: any[]) {
  if (blocks.length < 2) return 100
  
  const scores = blocks
    .filter(b => b.mastery_score !== null && b.mastery_score !== undefined)
    .map(b => b.mastery_score)
  
  if (scores.length < 2) return 100
  
  const mean = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
  const variance = scores.reduce((sum: number, score: number) => sum + Math.pow(score - mean, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)
  
  // Convert to consistency score (higher = more consistent)
  const consistencyScore = Math.max(0, 100 - (stdDev / mean * 100))
  return consistencyScore
}

// Calculate data quality score
function calculateDataQualityScore(data: any) {
  let score = 100
  
  // Penalize missing data
  if (!data.blockCompletions || data.blockCompletions.length === 0) score -= 20
  if (!data.learningSessions || data.learningSessions.length === 0) score -= 20
  if (!data.performanceHistory || data.performanceHistory.length === 0) score -= 10
  if (!data.userActivities || data.userActivities.length === 0) score -= 10
  
  // Check for data completeness
  const blocks = data.blockCompletions || []
  const sessions = data.learningSessions || []
  
  let missingFields = 0
  blocks.forEach((block: any) => {
    if (!block.content_engagement_score) missingFields++
    if (!block.mastery_score) missingFields++
  })
  
  sessions.forEach((session: any) => {
    if (!session.focus_score) missingFields++
    if (!session.learning_velocity) missingFields++
  })
  
  if (missingFields > 0) {
    score -= Math.min(30, missingFields * 2)
  }
  
  return Math.max(50, score)
}

// Compute performance benchmarks
async function computePerformanceBenchmarks(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientId?: string,
  batchSize: number = 1000
) {
  const results = {
    benchmarksCreated: 0,
    benchmarksUpdated: 0,
    errors: 0
  }
  
  // Compute different types of benchmarks
  const benchmarkTypes = [
    { type: 'industry', scope: 'global', scopeId: null },
    { type: 'organizational', scope: 'client', scopeId: clientId }
  ]
  
  for (const benchmark of benchmarkTypes) {
    if (benchmark.scopeId === undefined) continue // Skip if no client specified for client benchmarks
    
    try {
      await computeBenchmarkForScope(
        supabaseUrl,
        serviceRoleKey,
        benchmark.type,
        benchmark.scope,
        benchmark.scopeId,
        batchSize
      )
      results.benchmarksCreated++
    } catch (error) {
      console.error(`Error computing ${benchmark.type} benchmark:`, error)
      results.errors++
    }
  }
  
  return results
}

// Compute benchmark for specific scope
async function computeBenchmarkForScope(
  supabaseUrl: string,
  serviceRoleKey: string,
  benchmarkType: string,
  benchmarkScope: string,
  scopeId: string | null,
  batchSize: number
) {
  // Get recent analytics data for benchmark computation
  let analyticsUrl = `${supabaseUrl}/rest/v1/learning_analytics?select=*&limit=${batchSize}`
  
  if (scopeId) {
    analyticsUrl += `&client_id=eq.${scopeId}`
  }
  
  const analyticsResponse = await fetch(analyticsUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })
  
  if (!analyticsResponse.ok) {
    throw new Error(`Failed to fetch analytics data for benchmark computation`)
  }
  
  const analyticsData = await analyticsResponse.json()
  
  if (analyticsData.length === 0) {
    console.log(`No data available for ${benchmarkType} benchmark`)
    return
  }
  
  // Calculate benchmark metrics
  const benchmarkMetrics = calculateBenchmarkMetrics(analyticsData)
  
  // Create benchmark record
  const benchmarkRecord = {
    benchmark_type: benchmarkType,
    benchmark_scope: benchmarkScope,
    scope_id: scopeId,
    content_type: 'course', // Default for now
    difficulty_level: 'intermediate', // Default for now
    ...benchmarkMetrics,
    sample_size: analyticsData.length,
    last_computed: new Date().toISOString(),
    computation_period_days: 30
  }
  
  // Upsert benchmark
  const upsertUrl = `${supabaseUrl}/rest/v1/performance_benchmarks`
  const upsertResponse = await fetch(upsertUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(benchmarkRecord)
  })
  
  if (!upsertResponse.ok) {
    const errorText = await upsertResponse.text()
    throw new Error(`Failed to upsert benchmark: ${errorText}`)
  }
}

// Calculate benchmark metrics from analytics data
function calculateBenchmarkMetrics(analyticsData: any[]) {
  const completionTimes = analyticsData
    .filter(d => d.total_learning_time_minutes > 0)
    .map(d => d.total_learning_time_minutes / 60) // Convert to hours
  
  const masteryScores = analyticsData
    .filter(d => d.avg_mastery_score > 0)
    .map(d => d.avg_mastery_score)
  
  const engagementScores = analyticsData
    .filter(d => d.avg_engagement_score > 0)
    .map(d => d.avg_engagement_score)
  
  const attempts = analyticsData
    .filter(d => d.blocks_attempted > 0)
    .map(d => Math.max(1, Math.ceil(d.blocks_attempted / Math.max(d.blocks_completed, 1))))
  
  const successRates = analyticsData
    .filter(d => d.blocks_attempted > 0)
    .map(d => (d.blocks_completed / d.blocks_attempted) * 100)
  
  return {
    avg_completion_time_hours: calculateMean(completionTimes),
    avg_mastery_score: calculateMean(masteryScores),
    avg_engagement_score: calculateMean(engagementScores),
    median_attempts: calculateMedian(attempts),
    success_rate_percentage: calculateMean(successRates),
    performance_percentiles: calculatePercentiles(masteryScores),
    velocity_percentiles: calculatePercentiles(
      analyticsData.filter(d => d.avg_learning_velocity > 0).map(d => d.avg_learning_velocity)
    ),
    engagement_percentiles: calculatePercentiles(engagementScores)
  }
}

// Statistical helper functions
function calculateMean(values: number[]) {
  if (values.length === 0) return 0
  return Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2))
}

function calculateMedian(values: number[]) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? 
    Math.round((sorted[mid - 1] + sorted[mid]) / 2) : 
    Math.round(sorted[mid])
}

function calculatePercentiles(values: number[]) {
  if (values.length === 0) return {}
  
  const sorted = [...values].sort((a, b) => a - b)
  const percentiles = [10, 25, 50, 75, 90]
  const result: any = {}
  
  percentiles.forEach(p => {
    const index = Math.floor((p / 100) * sorted.length)
    result[`P${p}`] = Number(sorted[Math.min(index, sorted.length - 1)].toFixed(1))
  })
  
  return result
}

// Compute all analytics types
async function computeAllAnalytics(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientId?: string,
  userId?: string,
  batchSize: number = 100,
  forceRecalculation: boolean = false
) {
  const results: any = {}
  
  // Compute daily analytics
  results.daily = await computeDailyAnalytics(
    supabaseUrl, serviceRoleKey, clientId, userId, batchSize, forceRecalculation
  )
  
  // Compute weekly analytics
  results.weekly = await computeWeeklyAnalytics(
    supabaseUrl, serviceRoleKey, clientId, userId, batchSize, forceRecalculation
  )
  
  // Compute monthly analytics
  results.monthly = await computeMonthlyAnalytics(
    supabaseUrl, serviceRoleKey, clientId, userId, batchSize, forceRecalculation
  )
  
  // Compute benchmarks
  results.benchmarks = await computePerformanceBenchmarks(
    supabaseUrl, serviceRoleKey, clientId, batchSize
  )
  
  return results
}

// Logging functions
async function logComputationStart(
  supabaseUrl: string,
  serviceRoleKey: string,
  computationType: string,
  clientId?: string,
  userId?: string
) {
  const logRecord = {
    computation_type: computationType,
    computation_scope: userId ? 'user' : (clientId ? 'client' : 'global'),
    scope_id: userId || clientId || null,
    status: 'running',
    started_at: new Date().toISOString()
  }
  
  const response = await fetch(`${supabaseUrl}/rest/v1/analytics_computation_log`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(logRecord)
  })
  
  if (response.ok) {
    const result = await response.json()
    return result[0]?.id
  }
  
  return null
}

async function logComputationComplete(
  supabaseUrl: string,
  serviceRoleKey: string,
  logId: string | null,
  results: any,
  duration: number
) {
  if (!logId) return
  
  const updateRecord = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    records_processed: results.usersProcessed || results.benchmarksCreated || 0,
    records_updated: results.recordsUpdated || results.benchmarksUpdated || 0,
    errors_count: results.errors || 0,
    computation_duration_seconds: duration,
    performance_metrics: {
      batches_processed: results.batches || 1,
      avg_processing_time: duration / Math.max(results.usersProcessed || 1, 1),
      success_rate: results.usersProcessed ? 
        ((results.usersProcessed - results.errors) / results.usersProcessed * 100) : 100
    }
  }
  
  await fetch(`${supabaseUrl}/rest/v1/analytics_computation_log?id=eq.${logId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateRecord)
  })
}

async function logComputationError(
  supabaseUrl: string,
  serviceRoleKey: string,
  logId: string | null,
  error: any,
  duration: number
) {
  if (!logId) return
  
  const updateRecord = {
    status: 'failed',
    completed_at: new Date().toISOString(),
    errors_count: 1,
    error_details: {
      message: error.message,
      stack: error.stack
    },
    computation_duration_seconds: duration
  }
  
  await fetch(`${supabaseUrl}/rest/v1/analytics_computation_log?id=eq.${logId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateRecord)
  })
}