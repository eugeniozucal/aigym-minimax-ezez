// Automated Reports Edge Function - Scheduled report generation with customizable templates
// Supports multiple report types for different audiences with automated insights and trend alerts

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface ReportRequest {
  reportType: 'progress' | 'performance' | 'engagement' | 'retention' | 'comprehensive' | 'at_risk'
  audience: 'individual' | 'instructor' | 'administrator' | 'organization'
  clientId?: string
  userId?: string
  dateRange: {
    start: string
    end: string
  }
  templateId?: string
  outputFormat?: 'json' | 'summary' | 'detailed'
  includeRecommendations?: boolean
  scheduledGeneration?: boolean
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

    // Get user from auth header
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

    const {
      reportType,
      audience,
      clientId,
      userId,
      dateRange,
      templateId,
      outputFormat = 'detailed',
      includeRecommendations = true,
      scheduledGeneration = false
    }: ReportRequest = await req.json()

    // Generate the requested report
    const reportData = await generateReport(
      supabaseUrl,
      serviceRoleKey,
      reportType,
      audience,
      dateRange,
      clientId,
      userId || currentUserId,
      includeRecommendations
    )

    // Format the report based on output format and template
    const formattedReport = await formatReport(
      reportData,
      reportType,
      audience,
      outputFormat,
      templateId
    )

    // Generate automated insights and alerts
    const insights = await generateAutomatedInsights(
      reportData,
      reportType,
      audience
    )

    const response = {
      report: formattedReport,
      insights,
      metadata: {
        reportType,
        audience,
        dateRange,
        generatedAt: new Date().toISOString(),
        generatedBy: currentUserId,
        clientId,
        targetUserId: userId,
        scheduledGeneration
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Automated Reports Error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'AUTOMATED_REPORTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate automated report'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Main report generation function
async function generateReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  reportType: string,
  audience: string,
  dateRange: { start: string, end: string },
  clientId?: string,
  userId?: string,
  includeRecommendations: boolean = true
) {
  const reportData: any = {
    reportType,
    audience,
    dateRange,
    sections: {}
  }

  switch (reportType) {
    case 'progress':
      reportData.sections = await generateProgressReport(
        supabaseUrl, serviceRoleKey, dateRange, clientId, userId
      )
      break
      
    case 'performance':
      reportData.sections = await generatePerformanceReport(
        supabaseUrl, serviceRoleKey, dateRange, clientId, userId
      )
      break
      
    case 'engagement':
      reportData.sections = await generateEngagementReport(
        supabaseUrl, serviceRoleKey, dateRange, clientId, userId
      )
      break
      
    case 'retention':
      reportData.sections = await generateRetentionReport(
        supabaseUrl, serviceRoleKey, dateRange, clientId, userId
      )
      break
      
    case 'at_risk':
      reportData.sections = await generateAtRiskReport(
        supabaseUrl, serviceRoleKey, clientId
      )
      break
      
    case 'comprehensive':
      // Generate all report types for comprehensive analysis
      const allSections = await Promise.all([
        generateProgressReport(supabaseUrl, serviceRoleKey, dateRange, clientId, userId),
        generatePerformanceReport(supabaseUrl, serviceRoleKey, dateRange, clientId, userId),
        generateEngagementReport(supabaseUrl, serviceRoleKey, dateRange, clientId, userId),
        generateRetentionReport(supabaseUrl, serviceRoleKey, dateRange, clientId, userId)
      ])
      
      reportData.sections = {
        progress: allSections[0],
        performance: allSections[1],
        engagement: allSections[2],
        retention: allSections[3]
      }
      break
      
    default:
      throw new Error(`Unknown report type: ${reportType}`)
  }

  return reportData
}

// Progress report generation
async function generateProgressReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  dateRange: { start: string, end: string },
  clientId?: string,
  userId?: string
) {
  const progressData: any = {}

  // Get learning analytics data
  let analyticsUrl = `${supabaseUrl}/rest/v1/learning_analytics?select=*&period_start_date=gte.${dateRange.start}&period_end_date=lte.${dateRange.end}`
  
  if (clientId && clientId !== 'all') {
    analyticsUrl += `&client_id=eq.${clientId}`
  }
  
  if (userId) {
    analyticsUrl += `&user_id=eq.${userId}`
  }

  const analyticsResponse = await fetch(analyticsUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })

  if (analyticsResponse.ok) {
    const analytics = await analyticsResponse.json()
    
    // Calculate progress metrics
    progressData.totalUsers = analytics.length
    progressData.avgLearningTime = analytics.reduce((sum: number, user: any) => 
      sum + (user.total_learning_time_minutes || 0), 0) / analytics.length || 0
    
    progressData.avgBlocksCompleted = analytics.reduce((sum: number, user: any) => 
      sum + (user.blocks_completed || 0), 0) / analytics.length || 0
    
    progressData.avgMasteryRate = analytics.reduce((sum: number, user: any) => 
      sum + (user.blocks_mastered || 0), 0) / Math.max(progressData.avgBlocksCompleted, 1) * 100
    
    progressData.completionDistribution = calculateCompletionDistribution(analytics)
    progressData.learningVelocityTrends = analyzeLearningVelocityTrends(analytics)
    progressData.topPerformers = analytics
      .sort((a: any, b: any) => (b.blocks_mastered || 0) - (a.blocks_mastered || 0))
      .slice(0, 10)
  }

  return progressData
}

// Performance report generation
async function generatePerformanceReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  dateRange: { start: string, end: string },
  clientId?: string,
  userId?: string
) {
  const performanceData: any = {}

  // Get performance history data
  let performanceUrl = `${supabaseUrl}/rest/v1/performance_history?select=*&completed_at=gte.${dateRange.start}&completed_at=lte.${dateRange.end}`
  
  if (clientId && clientId !== 'all') {
    performanceUrl += `&client_id=eq.${clientId}`
  }
  
  if (userId) {
    performanceUrl += `&user_id=eq.${userId}`
  }

  const performanceResponse = await fetch(performanceUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })

  if (performanceResponse.ok) {
    const performance = await performanceResponse.json()
    
    performanceData.totalAttempts = performance.length
    performanceData.avgScore = performance.reduce((sum: number, attempt: any) => 
      sum + (attempt.score || 0), 0) / performance.length || 0
    
    performanceData.improvementRate = performance.filter((attempt: any) => 
      attempt.is_improvement).length / performance.length * 100 || 0
    
    performanceData.performanceByDifficulty = analyzePerformanceByDifficulty(performance)
    performanceData.consistencyScores = calculateConsistencyScores(performance)
    performanceData.completionTimeAnalysis = analyzeCompletionTimes(performance)
  }

  return performanceData
}

// Engagement report generation
async function generateEngagementReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  dateRange: { start: string, end: string },
  clientId?: string,
  userId?: string
) {
  const engagementData: any = {}

  // Get learning sessions data
  let sessionsUrl = `${supabaseUrl}/rest/v1/learning_sessions?select=*&started_at=gte.${dateRange.start}&started_at=lte.${dateRange.end}`
  
  if (clientId && clientId !== 'all') {
    sessionsUrl += `&client_id=eq.${clientId}`
  }
  
  if (userId) {
    sessionsUrl += `&user_id=eq.${userId}`
  }

  const sessionsResponse = await fetch(sessionsUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })

  if (sessionsResponse.ok) {
    const sessions = await sessionsResponse.json()
    
    engagementData.totalSessions = sessions.length
    engagementData.avgSessionDuration = sessions.reduce((sum: number, session: any) => 
      sum + (session.total_duration_seconds || 0), 0) / sessions.length / 60 || 0 // in minutes
    
    engagementData.avgFocusScore = sessions.reduce((sum: number, session: any) => 
      sum + (session.focus_score || 0), 0) / sessions.length || 0
    
    engagementData.avgEngagementScore = sessions.reduce((sum: number, session: any) => 
      sum + (session.engagement_score || 0), 0) / sessions.length || 0
    
    engagementData.sessionCompletionRate = sessions.filter((session: any) => 
      session.session_status === 'completed').length / sessions.length * 100 || 0
    
    engagementData.attentionSpanAnalysis = analyzeAttentionSpans(sessions)
    engagementData.breakPatterns = analyzeBreakPatterns(sessions)
    engagementData.deviceUsagePatterns = analyzeDeviceUsage(sessions)
  }

  return engagementData
}

// Retention report generation
async function generateRetentionReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  dateRange: { start: string, end: string },
  clientId?: string,
  userId?: string
) {
  const retentionData: any = {}

  // Get learning analytics with retention scores
  let retentionUrl = `${supabaseUrl}/rest/v1/learning_analytics?select=user_id,retention_score,skill_degradation_risk,knowledge_decay_rate&period_start_date=gte.${dateRange.start}&period_end_date=lte.${dateRange.end}`
  
  if (clientId && clientId !== 'all') {
    retentionUrl += `&client_id=eq.${clientId}`
  }
  
  if (userId) {
    retentionUrl += `&user_id=eq.${userId}`
  }

  const retentionResponse = await fetch(retentionUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })

  if (retentionResponse.ok) {
    const retention = await retentionResponse.json()
    
    retentionData.avgRetentionScore = retention.reduce((sum: number, user: any) => 
      sum + (user.retention_score || 0), 0) / retention.length || 0
    
    retentionData.highRiskUsers = retention.filter((user: any) => 
      user.skill_degradation_risk > 70).length
    
    retentionData.retentionDistribution = calculateRetentionDistribution(retention)
    retentionData.knowledgeDecayAnalysis = analyzeKnowledgeDecay(retention)
    retentionData.interventionRecommendations = generateInterventionRecommendations(retention)
  }

  return retentionData
}

// At-risk learners report
async function generateAtRiskReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientId?: string
) {
  const atRiskData: any = {}

  let atRiskUrl = `${supabaseUrl}/rest/v1/learning_analytics?select=*&at_risk_indicator=eq.true`
  
  if (clientId && clientId !== 'all') {
    atRiskUrl += `&client_id=eq.${clientId}`
  }

  const atRiskResponse = await fetch(atRiskUrl, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  })

  if (atRiskResponse.ok) {
    const atRiskUsers = await atRiskResponse.json()
    
    atRiskData.totalAtRiskUsers = atRiskUsers.length
    atRiskData.riskFactorAnalysis = analyzeRiskFactors(atRiskUsers)
    atRiskData.interventionPriority = prioritizeInterventions(atRiskUsers)
    atRiskData.recommendedActions = generateActionPlan(atRiskUsers)
  }

  return atRiskData
}

// Format report based on output format and template
async function formatReport(
  reportData: any,
  reportType: string,
  audience: string,
  outputFormat: string,
  templateId?: string
) {
  if (outputFormat === 'summary') {
    return formatSummaryReport(reportData, audience)
  } else if (outputFormat === 'json') {
    return reportData
  } else {
    return formatDetailedReport(reportData, audience, templateId)
  }
}

// Generate automated insights and alerts
async function generateAutomatedInsights(
  reportData: any,
  reportType: string,
  audience: string
) {
  const insights: any = {
    alerts: [],
    trends: [],
    recommendations: [],
    keyFindings: []
  }

  // Analyze data for automatic insights
  if (reportData.sections.progress) {
    insights.trends.push(...analyzeProgressTrends(reportData.sections.progress))
  }

  if (reportData.sections.performance) {
    insights.alerts.push(...detectPerformanceAlerts(reportData.sections.performance))
  }

  if (reportData.sections.engagement) {
    insights.recommendations.push(...generateEngagementRecommendations(reportData.sections.engagement))
  }

  if (reportData.sections.retention) {
    insights.alerts.push(...detectRetentionAlerts(reportData.sections.retention))
  }

  return insights
}

// Helper functions for data analysis
function calculateCompletionDistribution(analytics: any[]) {
  const distribution = { low: 0, medium: 0, high: 0 }
  
  analytics.forEach(user => {
    const completionRate = (user.blocks_completed || 0) / Math.max(user.blocks_attempted || 1, 1)
    if (completionRate < 0.5) distribution.low++
    else if (completionRate < 0.8) distribution.medium++
    else distribution.high++
  })
  
  return distribution
}

function analyzeLearningVelocityTrends(analytics: any[]) {
  const trends = analytics.map(user => ({
    user_id: user.user_id,
    velocity: user.avg_learning_velocity || 0,
    trend: user.learning_velocity_trend || 'stable'
  }))
  
  return trends.sort((a, b) => b.velocity - a.velocity)
}

function analyzePerformanceByDifficulty(performance: any[]) {
  const byDifficulty: any = {}
  
  performance.forEach(attempt => {
    const difficulty = attempt.difficulty_level || 'medium'
    if (!byDifficulty[difficulty]) {
      byDifficulty[difficulty] = { attempts: 0, avgScore: 0, totalScore: 0 }
    }
    
    byDifficulty[difficulty].attempts++
    byDifficulty[difficulty].totalScore += attempt.score || 0
  })
  
  Object.values(byDifficulty).forEach((diff: any) => {
    diff.avgScore = diff.totalScore / diff.attempts
  })
  
  return byDifficulty
}

function calculateConsistencyScores(performance: any[]) {
  const userScores: any = {}
  
  performance.forEach(attempt => {
    const userId = attempt.user_id
    if (!userScores[userId]) userScores[userId] = []
    userScores[userId].push(attempt.score || 0)
  })
  
  const consistency: any = {}
  Object.entries(userScores).forEach(([userId, scores]: [string, any]) => {
    const mean = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
    const variance = scores.reduce((sum: number, score: number) => sum + Math.pow(score - mean, 2), 0) / scores.length
    consistency[userId] = 1 - (Math.sqrt(variance) / mean) // Higher = more consistent
  })
  
  return consistency
}

function analyzeCompletionTimes(performance: any[]) {
  const times = performance
    .filter(attempt => attempt.completion_time)
    .map(attempt => {
      const time = attempt.completion_time
      // Convert interval to seconds (simplified)
      return parseFloat(time.replace(/[^0-9.]/g, '')) || 0
    })
  
  if (times.length === 0) return { avg: 0, median: 0, distribution: {} }
  
  times.sort((a, b) => a - b)
  const avg = times.reduce((sum, time) => sum + time, 0) / times.length
  const median = times[Math.floor(times.length / 2)]
  
  return { avg, median, distribution: categorizeCompletionTimes(times) }
}

function categorizeCompletionTimes(times: number[]) {
  const categories = { fast: 0, average: 0, slow: 0 }
  const q1 = times[Math.floor(times.length * 0.25)]
  const q3 = times[Math.floor(times.length * 0.75)]
  
  times.forEach(time => {
    if (time <= q1) categories.fast++
    else if (time <= q3) categories.average++
    else categories.slow++
  })
  
  return categories
}

function analyzeAttentionSpans(sessions: any[]) {
  const spans = sessions
    .filter(session => session.attention_span_minutes)
    .map(session => session.attention_span_minutes)
  
  if (spans.length === 0) return { avg: 0, distribution: {} }
  
  const avg = spans.reduce((sum, span) => sum + span, 0) / spans.length
  const distribution = {
    short: spans.filter(span => span < 15).length,
    medium: spans.filter(span => span >= 15 && span < 45).length,
    long: spans.filter(span => span >= 45).length
  }
  
  return { avg, distribution }
}

function analyzeBreakPatterns(sessions: any[]) {
  const breakData = sessions
    .filter(session => session.break_count !== undefined)
    .map(session => ({
      duration: session.total_duration_seconds / 60, // minutes
      breaks: session.break_count,
      breaksPerHour: (session.break_count / (session.total_duration_seconds / 3600)) || 0
    }))
  
  const avgBreaksPerHour = breakData.reduce((sum, data) => sum + data.breaksPerHour, 0) / breakData.length || 0
  
  return { avgBreaksPerHour, sessions: breakData.length }
}

function analyzeDeviceUsage(sessions: any[]) {
  const deviceCount: any = {}
  
  sessions.forEach(session => {
    if (session.device_info && session.device_info.type) {
      const device = session.device_info.type
      deviceCount[device] = (deviceCount[device] || 0) + 1
    }
  })
  
  return deviceCount
}

function calculateRetentionDistribution(retention: any[]) {
  const distribution = { excellent: 0, good: 0, poor: 0, critical: 0 }
  
  retention.forEach(user => {
    const score = user.retention_score || 0
    if (score >= 90) distribution.excellent++
    else if (score >= 75) distribution.good++
    else if (score >= 50) distribution.poor++
    else distribution.critical++
  })
  
  return distribution
}

function analyzeKnowledgeDecay(retention: any[]) {
  const decayRates = retention
    .filter(user => user.knowledge_decay_rate !== undefined)
    .map(user => user.knowledge_decay_rate)
  
  if (decayRates.length === 0) return { avg: 0, trend: 'stable' }
  
  const avg = decayRates.reduce((sum, rate) => sum + rate, 0) / decayRates.length
  const trend = avg > 10 ? 'concerning' : avg > 5 ? 'moderate' : 'stable'
  
  return { avg, trend, usersAnalyzed: decayRates.length }
}

function generateInterventionRecommendations(retention: any[]) {
  const recommendations: any[] = []
  
  const highRiskUsers = retention.filter(user => user.skill_degradation_risk > 70)
  if (highRiskUsers.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Schedule refresher sessions',
      targetUsers: highRiskUsers.length,
      reason: 'High skill degradation risk detected'
    })
  }
  
  const lowRetentionUsers = retention.filter(user => user.retention_score < 60)
  if (lowRetentionUsers.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Implement spaced repetition',
      targetUsers: lowRetentionUsers.length,
      reason: 'Low retention scores detected'
    })
  }
  
  return recommendations
}

function analyzeRiskFactors(atRiskUsers: any[]) {
  const factors: any = {
    lowEngagement: 0,
    poorRetention: 0,
    inconsistentPerformance: 0,
    skillDegradation: 0
  }
  
  atRiskUsers.forEach(user => {
    if (user.avg_engagement_score < 60) factors.lowEngagement++
    if (user.retention_score < 60) factors.poorRetention++
    if (user.performance_consistency_score < 60) factors.inconsistentPerformance++
    if (user.skill_degradation_risk > 70) factors.skillDegradation++
  })
  
  return factors
}

function prioritizeInterventions(atRiskUsers: any[]) {
  return atRiskUsers
    .map(user => ({
      user_id: user.user_id,
      riskScore: calculateRiskScore(user),
      primaryConcern: identifyPrimaryConcern(user),
      recommendedIntervention: recommendIntervention(user)
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
}

function calculateRiskScore(user: any) {
  let score = 0
  if (user.avg_engagement_score < 60) score += 25
  if (user.retention_score < 60) score += 30
  if (user.performance_consistency_score < 60) score += 25
  if (user.skill_degradation_risk > 70) score += 20
  return score
}

function identifyPrimaryConcern(user: any) {
  if (user.skill_degradation_risk > 70) return 'skill_degradation'
  if (user.retention_score < 50) return 'poor_retention'
  if (user.avg_engagement_score < 50) return 'low_engagement'
  if (user.performance_consistency_score < 50) return 'inconsistent_performance'
  return 'general_risk'
}

function recommendIntervention(user: any) {
  const concern = identifyPrimaryConcern(user)
  
  const interventions: any = {
    skill_degradation: 'Schedule immediate refresher training',
    poor_retention: 'Implement spaced repetition and review sessions',
    low_engagement: 'Provide motivational support and varied content',
    inconsistent_performance: 'Offer additional practice and feedback',
    general_risk: 'Comprehensive assessment and personalized plan'
  }
  
  return interventions[concern]
}

function generateActionPlan(atRiskUsers: any[]) {
  const actionPlan: any = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  }
  
  atRiskUsers.forEach(user => {
    const riskScore = calculateRiskScore(user)
    
    if (riskScore >= 75) {
      actionPlan.immediate.push({
        user_id: user.user_id,
        action: 'Emergency intervention required'
      })
    } else if (riskScore >= 50) {
      actionPlan.shortTerm.push({
        user_id: user.user_id,
        action: 'Targeted support within 1 week'
      })
    } else {
      actionPlan.longTerm.push({
        user_id: user.user_id,
        action: 'Monitor progress and provide support as needed'
      })
    }
  })
  
  return actionPlan
}

function formatSummaryReport(reportData: any, audience: string) {
  // Create audience-appropriate summary
  return {
    title: `${reportData.reportType.charAt(0).toUpperCase()}${reportData.reportType.slice(1)} Summary`,
    audience,
    dateRange: reportData.dateRange,
    keyMetrics: extractKeyMetrics(reportData),
    highlights: extractHighlights(reportData),
    concerns: extractConcerns(reportData)
  }
}

function formatDetailedReport(reportData: any, audience: string, templateId?: string) {
  // Format detailed report with all sections
  return {
    title: `Comprehensive ${reportData.reportType.charAt(0).toUpperCase()}${reportData.reportType.slice(1)} Report`,
    audience,
    dateRange: reportData.dateRange,
    templateId,
    sections: reportData.sections,
    summary: extractKeyMetrics(reportData),
    recommendations: extractRecommendations(reportData)
  }
}

function extractKeyMetrics(reportData: any) {
  // Extract the most important metrics for each section
  const metrics: any = {}
  
  Object.entries(reportData.sections).forEach(([section, data]: [string, any]) => {
    switch (section) {
      case 'progress':
        metrics.progress = {
          totalUsers: data.totalUsers,
          avgLearningTime: data.avgLearningTime,
          avgBlocksCompleted: data.avgBlocksCompleted,
          avgMasteryRate: data.avgMasteryRate
        }
        break
      case 'performance':
        metrics.performance = {
          avgScore: data.avgScore,
          improvementRate: data.improvementRate,
          totalAttempts: data.totalAttempts
        }
        break
      case 'engagement':
        metrics.engagement = {
          avgSessionDuration: data.avgSessionDuration,
          avgFocusScore: data.avgFocusScore,
          sessionCompletionRate: data.sessionCompletionRate
        }
        break
      case 'retention':
        metrics.retention = {
          avgRetentionScore: data.avgRetentionScore,
          highRiskUsers: data.highRiskUsers
        }
        break
    }
  })
  
  return metrics
}

function extractHighlights(reportData: any) {
  const highlights: string[] = []
  
  Object.entries(reportData.sections).forEach(([section, data]: [string, any]) => {
    if (section === 'progress' && data.avgMasteryRate > 80) {
      highlights.push(`Excellent mastery rate of ${data.avgMasteryRate.toFixed(1)}%`)
    }
    if (section === 'engagement' && data.avgFocusScore > 80) {
      highlights.push(`High focus scores averaging ${data.avgFocusScore.toFixed(1)}`)
    }
    if (section === 'performance' && data.improvementRate > 70) {
      highlights.push(`Strong improvement rate of ${data.improvementRate.toFixed(1)}%`)
    }
  })
  
  return highlights
}

function extractConcerns(reportData: any) {
  const concerns: string[] = []
  
  Object.entries(reportData.sections).forEach(([section, data]: [string, any]) => {
    if (section === 'retention' && data.highRiskUsers > 0) {
      concerns.push(`${data.highRiskUsers} users at high risk of skill degradation`)
    }
    if (section === 'engagement' && data.avgFocusScore < 60) {
      concerns.push(`Low focus scores averaging ${data.avgFocusScore.toFixed(1)}`)
    }
    if (section === 'performance' && data.improvementRate < 30) {
      concerns.push(`Low improvement rate of ${data.improvementRate.toFixed(1)}%`)
    }
  })
  
  return concerns
}

function extractRecommendations(reportData: any) {
  const recommendations: string[] = []
  
  Object.entries(reportData.sections).forEach(([section, data]: [string, any]) => {
    if (section === 'retention' && data.interventionRecommendations) {
      data.interventionRecommendations.forEach((rec: any) => {
        recommendations.push(`${rec.action} for ${rec.targetUsers} users (${rec.priority} priority)`)
      })
    }
    if (section === 'engagement' && data.avgSessionDuration < 30) {
      recommendations.push('Consider shorter, more focused learning sessions')
    }
    if (section === 'performance' && data.avgScore < 70) {
      recommendations.push('Implement additional support and practice opportunities')
    }
  })
  
  return recommendations
}

// Insight generation functions
function analyzeProgressTrends(progressData: any) {
  const trends: any[] = []
  
  if (progressData.learningVelocityTrends) {
    const improvingUsers = progressData.learningVelocityTrends.filter((user: any) => user.trend === 'improving').length
    const decliningUsers = progressData.learningVelocityTrends.filter((user: any) => user.trend === 'declining').length
    
    if (improvingUsers > decliningUsers * 2) {
      trends.push({
        type: 'positive',
        message: `Learning velocity is improving for ${improvingUsers} users`,
        impact: 'high'
      })
    } else if (decliningUsers > improvingUsers) {
      trends.push({
        type: 'negative',
        message: `Learning velocity is declining for ${decliningUsers} users`,
        impact: 'medium'
      })
    }
  }
  
  return trends
}

function detectPerformanceAlerts(performanceData: any) {
  const alerts: any[] = []
  
  if (performanceData.avgScore < 60) {
    alerts.push({
      severity: 'high',
      message: `Average performance score is critically low at ${performanceData.avgScore.toFixed(1)}%`,
      action: 'Immediate intervention required'
    })
  }
  
  if (performanceData.improvementRate < 20) {
    alerts.push({
      severity: 'medium',
      message: `Low improvement rate of ${performanceData.improvementRate.toFixed(1)}%`,
      action: 'Review teaching methods and provide additional support'
    })
  }
  
  return alerts
}

function generateEngagementRecommendations(engagementData: any) {
  const recommendations: any[] = []
  
  if (engagementData.avgFocusScore < 70) {
    recommendations.push({
      priority: 'high',
      category: 'focus',
      message: 'Implement attention-building exercises and minimize distractions',
      expectedImpact: 'Improve focus scores by 15-20%'
    })
  }
  
  if (engagementData.sessionCompletionRate < 80) {
    recommendations.push({
      priority: 'medium',
      category: 'completion',
      message: 'Break content into smaller, more manageable chunks',
      expectedImpact: 'Increase session completion rate by 10-15%'
    })
  }
  
  if (engagementData.avgSessionDuration > 90) {
    recommendations.push({
      priority: 'low',
      category: 'duration',
      message: 'Consider shorter learning sessions to maintain engagement',
      expectedImpact: 'Improved attention and retention'
    })
  }
  
  return recommendations
}

function detectRetentionAlerts(retentionData: any) {
  const alerts: any[] = []
  
  if (retentionData.avgRetentionScore < 60) {
    alerts.push({
      severity: 'high',
      message: `Critical retention score of ${retentionData.avgRetentionScore.toFixed(1)}%`,
      action: 'Implement immediate spaced repetition and review protocols'
    })
  }
  
  if (retentionData.highRiskUsers > 0) {
    alerts.push({
      severity: 'medium',
      message: `${retentionData.highRiskUsers} users at high risk of skill degradation`,
      action: 'Schedule refresher training for at-risk users'
    })
  }
  
  return alerts
}