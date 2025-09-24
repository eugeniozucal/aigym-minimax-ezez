// Helper functions for advanced analytics dashboard

// Calculate analytics summary from raw data
export function calculateAnalyticsSummary(data: any[]): any {
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
export function generateAnalyticsInsights(data: any[]): any {
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
export function calculateDataFreshness(data: any[]): string {
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
export function getVelocityTrendScore(trendIndicator: string | null): number {
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
export function getEfficiencyRating(timeEfficiency: number | null, effortEfficiency: number | null): string {
  const timeScore = timeEfficiency || 0
  const effortScore = effortEfficiency || 0
  const combinedScore = (timeScore + effortScore) / 2

  if (combinedScore >= 0.8) return 'excellent'
  if (combinedScore >= 0.6) return 'good'
  if (combinedScore >= 0.4) return 'fair'
  return 'needs_improvement'
}

// Calculate summary of velocity metrics
export function calculateVelocityMetricsSummary(velocityData: any[]): any {
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
export function analyzeVelocityTrends(velocityData: any[]): any {
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
