# Phase 7 API Documentation: Complete Reference Guide

**Version:** 1.0  
**Last Updated:** September 13, 2025  
**Author:** MiniMax Agent  
**Status:** Production Ready  

---

## Overview

This comprehensive API documentation covers all Phase 7 Progress Tracking endpoints, providing detailed information for developers integrating with the AI GYM platform's enhanced progress tracking, program management, and achievement systems.

### Base Configuration
```typescript
// Supabase Configuration
const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Base API URL Pattern
const apiBaseUrl = `${supabaseUrl}/functions/v1`;
```

### Authentication
All Phase 7 APIs require authentication via Supabase JWT tokens:
```typescript
const headers = {
  'Authorization': `Bearer ${userJWT}`,
  'Content-Type': 'application/json',
  'x-community-id': clientId // Multi-tenant isolation
};
```

---

## Program Management APIs

### 1. Programs API

**Endpoint:** `POST /functions/v1/programs-api`

#### Create Program
```typescript
// Request
POST /functions/v1/programs-api
{
  "action": "create",
  "title": "Advanced JavaScript Mastery",
  "description": "Comprehensive program covering advanced JavaScript concepts",
  "duration_weeks": 12,
  "difficulty_level": "advanced",
  "prerequisites": ["javascript-basics", "es6-fundamentals"],
  "course_assignments": [
    { "course_id": "course-123", "sequence_order": 1 },
    { "course_id": "course-124", "sequence_order": 2 }
  ]
}

// Response
{
  "success": true,
  "data": {
    "id": "prog-789",
    "title": "Advanced JavaScript Mastery",
    "description": "Comprehensive program covering advanced JavaScript concepts",
    "duration_weeks": 12,
    "status": "active",
    "created_at": "2025-09-13T21:25:00Z",
    "created_by": "user-456",
    "community_id": "community-123"
  }
}
```

#### List Programs
```typescript
// Request
POST /functions/v1/programs-api
{
  "action": "list",
  "filters": {
    "status": "active",
    "difficulty_level": "advanced"
  },
  "pagination": {
    "page": 1,
    "limit": 20
  }
}

// Response
{
  "success": true,
  "data": {
    "programs": [
      {
        "id": "prog-789",
        "title": "Advanced JavaScript Mastery",
        "description": "Comprehensive program...",
        "duration_weeks": 12,
        "enrollment_count": 45,
        "completion_rate": 78.5
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "pages": 8
    }
  }
}
```

#### Update Program
```typescript
// Request
POST /functions/v1/programs-api
{
  "action": "update",
  "program_id": "prog-789",
  "updates": {
    "title": "Advanced JavaScript Mastery - Updated",
    "duration_weeks": 14,
    "status": "active"
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "prog-789",
    "title": "Advanced JavaScript Mastery - Updated",
    "duration_weeks": 14,
    "updated_at": "2025-09-13T21:30:00Z"
  }
}
```

### 2. Program Enrollment API

**Endpoint:** `POST /functions/v1/program-enrollment-api`

#### Enroll User
```typescript
// Request
POST /functions/v1/program-enrollment-api
{
  "action": "enroll",
  "program_id": "prog-789",
  "user_id": "user-456",
  "enrollment_type": "self_enrolled",
  "target_completion_date": "2025-12-13"
}

// Response
{
  "success": true,
  "data": {
    "enrollment_id": "enroll-321",
    "program_id": "prog-789",
    "user_id": "user-456",
    "enrolled_at": "2025-09-13T21:25:00Z",
    "status": "active",
    "progress_percentage": 0,
    "estimated_completion": "2025-12-13"
  }
}
```

#### Get Enrollment Progress
```typescript
// Request
POST /functions/v1/program-enrollment-api
{
  "action": "get_progress",
  "enrollment_id": "enroll-321"
}

// Response
{
  "success": true,
  "data": {
    "enrollment_id": "enroll-321",
    "progress_percentage": 34.5,
    "completed_courses": 3,
    "total_courses": 8,
    "current_course": {
      "id": "course-124",
      "title": "Async Programming Patterns",
      "progress_percentage": 67.2
    },
    "achievements_earned": [
      {
        "id": "achievement-101",
        "title": "JavaScript Fundamentals",
        "earned_at": "2025-09-10T14:30:00Z"
      }
    ]
  }
}
```

---

## Achievement System APIs

### 3. Achievements API

**Endpoint:** `POST /functions/v1/achievements-api`

#### Create Achievement
```typescript
// Request
POST /functions/v1/achievements-api
{
  "action": "create",
  "title": "JavaScript Master",
  "description": "Completed all advanced JavaScript courses with 90%+ score",
  "badge_image_url": "https://example.com/badges/js-master.png",
  "points_value": 500,
  "achievement_type": "completion",
  "criteria": {
    "course_completion_threshold": 90,
    "required_courses": ["course-123", "course-124"],
    "time_limit_days": 180
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "achievement-789",
    "title": "JavaScript Master",
    "description": "Completed all advanced JavaScript courses with 90%+ score",
    "badge_image_url": "https://example.com/badges/js-master.png",
    "points_value": 500,
    "created_at": "2025-09-13T21:25:00Z",
    "status": "active"
  }
}
```

#### List Available Achievements
```typescript
// Request
POST /functions/v1/achievements-api
{
  "action": "list",
  "filters": {
    "achievement_type": "completion",
    "status": "active"
  }
}

// Response
{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": "achievement-789",
        "title": "JavaScript Master",
        "description": "Completed all advanced JavaScript courses...",
        "points_value": 500,
        "rarity": "legendary",
        "earned_count": 23
      }
    ]
  }
}
```

### 4. Milestone Validation API

**Endpoint:** `POST /functions/v1/milestone-validation-api`

#### Validate User Achievement
```typescript
// Request
POST /functions/v1/milestone-validation-api
{
  "action": "validate_achievement",
  "user_id": "user-456",
  "achievement_id": "achievement-789",
  "completion_data": {
    "course_id": "course-124",
    "completion_score": 92.5,
    "completion_time": "2025-09-13T21:20:00Z"
  }
}

// Response
{
  "success": true,
  "data": {
    "achievement_earned": true,
    "user_achievement_id": "user-achieve-456",
    "earned_at": "2025-09-13T21:25:00Z",
    "verification_data": {
      "validation_method": "automated",
      "score_verified": true,
      "criteria_met": [
        "completion_threshold",
        "required_courses",
        "time_limit"
      ]
    }
  }
}
```

#### Check Milestone Progress
```typescript
// Request
POST /functions/v1/milestone-validation-api
{
  "action": "check_progress",
  "user_id": "user-456",
  "milestone_type": "course", // or "program"
  "milestone_id": "course-124"
}

// Response
{
  "success": true,
  "data": {
    "milestone_id": "course-124",
    "progress_percentage": 67.2,
    "completed_blocks": 15,
    "total_blocks": 23,
    "estimated_completion": "2025-09-18T12:00:00Z",
    "next_milestone": {
      "id": "course-125",
      "title": "Advanced React Patterns",
      "unlock_criteria_met": true
    }
  }
}
```

---

## Enhanced Progress Tracking APIs

### 5. Enhanced Progress Tracking API

**Endpoint:** `POST /functions/v1/enhanced-progress-tracking`

#### Record Block Completion
```typescript
// Request
POST /functions/v1/enhanced-progress-tracking
{
  "action": "record_completion",
  "user_id": "user-456",
  "block_id": "block-789",
  "completion_data": {
    "completion_time": "2025-09-13T21:20:00Z",
    "engagement_score": 85,
    "time_spent_minutes": 12,
    "interactions": {
      "clicks": 15,
      "scrolls": 8,
      "form_submissions": 2
    }
  }
}

// Response
{
  "success": true,
  "data": {
    "completion_id": "completion-123",
    "block_id": "block-789",
    "completed_at": "2025-09-13T21:20:00Z",
    "engagement_score": 85,
    "achievements_triggered": [
      {
        "id": "achievement-101",
        "title": "Engagement Master",
        "reason": "High engagement score achieved"
      }
    ]
  }
}
```

#### Get Detailed Progress
```typescript
// Request
POST /functions/v1/enhanced-progress-tracking
{
  "action": "get_progress",
  "user_id": "user-456",
  "content_type": "course", // or "program"
  "content_id": "course-124",
  "include_analytics": true
}

// Response
{
  "success": true,
  "data": {
    "content_id": "course-124",
    "progress_percentage": 67.2,
    "completed_blocks": 15,
    "total_blocks": 23,
    "time_spent_total_minutes": 240,
    "average_engagement_score": 78.5,
    "learning_velocity": {
      "blocks_per_day": 2.3,
      "minutes_per_block": 16.2
    },
    "detailed_blocks": [
      {
        "block_id": "block-789",
        "completed": true,
        "completion_date": "2025-09-13T21:20:00Z",
        "engagement_score": 85
      }
    ]
  }
}
```

### 6. Learning Path Validator API

**Endpoint:** `POST /functions/v1/learning-path-validator`

#### Validate Learning Path
```typescript
// Request
POST /functions/v1/learning-path-validator
{
  "action": "validate_path",
  "user_id": "user-456",
  "proposed_path": [
    { "content_type": "course", "content_id": "course-123", "sequence": 1 },
    { "content_type": "course", "content_id": "course-124", "sequence": 2 }
  ]
}

// Response
{
  "success": true,
  "data": {
    "path_valid": true,
    "validation_results": [
      {
        "content_id": "course-123",
        "prerequisites_met": true,
        "difficulty_appropriate": true,
        "estimated_duration_weeks": 4
      },
      {
        "content_id": "course-124",
        "prerequisites_met": true,
        "difficulty_appropriate": true,
        "estimated_duration_weeks": 6,
        "recommendations": [
          "Consider adding practice project between courses"
        ]
      }
    ],
    "total_estimated_duration_weeks": 10,
    "success_probability": 85.2
  }
}
```

### 7. Mastery Assessment API

**Endpoint:** `POST /functions/v1/mastery-assessment-api`

#### Assess User Mastery
```typescript
// Request
POST /functions/v1/mastery-assessment-api
{
  "action": "assess_mastery",
  "user_id": "user-456",
  "skill_domain": "javascript",
  "assessment_type": "comprehensive",
  "include_recommendations": true
}

// Response
{
  "success": true,
  "data": {
    "user_id": "user-456",
    "skill_domain": "javascript",
    "mastery_score": 78.5,
    "mastery_level": "intermediate",
    "assessment_date": "2025-09-13T21:25:00Z",
    "skill_breakdown": {
      "fundamentals": { "score": 92, "level": "advanced" },
      "async_programming": { "score": 85, "level": "intermediate" },
      "dom_manipulation": { "score": 76, "level": "intermediate" },
      "es6_features": { "score": 68, "level": "beginner" }
    },
    "recommendations": [
      {
        "priority": "high",
        "skill": "es6_features",
        "suggested_content": ["course-125", "course-126"],
        "estimated_improvement": 15.2
      }
    ],
    "next_assessment_recommended": "2025-10-13T00:00:00Z"
  }
}
```

---

## Analytics APIs

### 8. Analytics Dashboard API

**Endpoint:** `POST /functions/v1/analytics-dashboard`

#### Get Dashboard Data
```typescript
// Request
POST /functions/v1/analytics-dashboard
{
  "action": "get_dashboard",
  "community_id": "community-123",
  "date_range": {
    "start_date": "2025-09-01",
    "end_date": "2025-09-13"
  },
  "metrics": ["engagement", "completion", "achievement", "user_activity"]
}

// Response
{
  "success": true,
  "data": {
    "overview": {
      "total_users": 1247,
      "active_users_30d": 892,
      "completion_rate": 67.8,
      "average_engagement": 78.5
    },
    "engagement_metrics": {
      "daily_active_users": [
        { "date": "2025-09-13", "users": 156 },
        { "date": "2025-09-12", "users": 142 }
      ],
      "session_duration_avg_minutes": 24.5,
      "bounce_rate": 12.3
    },
    "completion_metrics": {
      "course_completions": {
        "this_month": 234,
        "last_month": 198,
        "growth_rate": 18.2
      },
      "program_completions": {
        "this_month": 67,
        "last_month": 52,
        "growth_rate": 28.8
      }
    },
    "achievement_metrics": {
      "total_achievements_earned": 1456,
      "most_popular_achievement": {
        "id": "achievement-101",
        "title": "First Steps",
        "earned_count": 234
      },
      "achievement_distribution": [
        { "level": "bronze", "count": 892 },
        { "level": "silver", "count": 342 },
        { "level": "gold", "count": 156 },
        { "level": "legendary", "count": 66 }
      ]
    }
  }
}
```

### 9. Automated Reports API

**Endpoint:** `POST /functions/v1/automated-reports`

#### Generate Progress Report
```typescript
// Request
POST /functions/v1/automated-reports
{
  "action": "generate_report",
  "report_type": "progress_summary",
  "community_id": "community-123",
  "parameters": {
    "date_range": "last_30_days",
    "include_users": ["user-456", "user-789"],
    "format": "detailed"
  }
}

// Response
{
  "success": true,
  "data": {
    "report_id": "report-123",
    "report_type": "progress_summary",
    "generated_at": "2025-09-13T21:25:00Z",
    "summary": {
      "users_analyzed": 2,
      "total_progress_points": 1567,
      "average_completion_rate": 73.5,
      "achievements_earned": 12
    },
    "user_details": [
      {
        "user_id": "user-456",
        "progress_percentage": 78.2,
        "courses_completed": 5,
        "achievements_earned": 8,
        "total_time_spent_hours": 42.5,
        "performance_trend": "improving"
      }
    ],
    "recommendations": [
      "User 456 shows strong engagement - consider advanced content",
      "User 789 may benefit from additional support in core concepts"
    ],
    "export_url": "https://example.com/reports/report-123.pdf"
  }
}
```

### 10. Background Analytics Cron API

**Endpoint:** `POST /functions/v1/background-analytics-cron`

#### Trigger Analytics Processing
```typescript
// Request
POST /functions/v1/background-analytics-cron
{
  "action": "process_analytics",
  "process_type": "daily_aggregation",
  "date": "2025-09-13"
}

// Response
{
  "success": true,
  "data": {
    "process_id": "process-789",
    "process_type": "daily_aggregation",
    "started_at": "2025-09-13T21:25:00Z",
    "estimated_completion": "2025-09-13T21:35:00Z",
    "metrics_processed": {
      "user_sessions": 1456,
      "block_completions": 3421,
      "achievement_awards": 89,
      "progress_updates": 2567
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid user_id provided",
    "details": {
      "field": "user_id",
      "value": "invalid-id",
      "expected": "Valid UUID format"
    },
    "timestamp": "2025-09-13T21:25:00Z",
    "request_id": "req-789"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_FAILED`: Invalid or expired JWT token
- `AUTHORIZATION_DENIED`: Insufficient permissions for operation
- `VALIDATION_ERROR`: Invalid request parameters or data
- `NOT_FOUND`: Requested resource does not exist
- `CONFLICT`: Operation conflicts with existing data
- `RATE_LIMIT_EXCEEDED`: Too many requests from community
- `INTERNAL_ERROR`: Server-side processing error

---

## Performance Guidelines

### API Response Time Targets
- **Progress Tracking**: <200ms response time
- **Analytics Queries**: <500ms response time
- **Report Generation**: <2 seconds for standard reports
- **Background Processing**: Asynchronous with status updates

### Rate Limiting
- **Standard APIs**: 1000 requests/hour per user
- **Analytics APIs**: 100 requests/hour per user
- **Report Generation**: 10 requests/hour per user
- **Bulk Operations**: 5 requests/hour per user

### Optimization Recommendations
- Use pagination for large data sets
- Implement community-side caching for static data
- Batch multiple operations when possible
- Use WebSocket connections for real-time updates

---

## Integration Examples

### Frontend Integration Pattern
```typescript
// React Hook for Progress Tracking
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const useProgressTracking = (userId: string, contentId: string) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'enhanced-progress-tracking',
          {
            body: {
              action: 'get_progress',
              user_id: userId,
              content_type: 'course',
              content_id: contentId,
              include_analytics: true
            }
          }
        );

        if (error) throw error;
        setProgress(data.data);
      } catch (error) {
        console.error('Progress fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId, contentId]);

  return { progress, loading };
};
```

### Achievement System Integration
```typescript
// Achievement Validation Service
class AchievementService {
  static async validateAchievement(
    userId: string,
    achievementId: string,
    completionData: any
  ) {
    const { data, error } = await supabase.functions.invoke(
      'milestone-validation-api',
      {
        body: {
          action: 'validate_achievement',
          user_id: userId,
          achievement_id: achievementId,
          completion_data: completionData
        }
      }
    );

    if (error) {
      throw new Error(`Achievement validation failed: ${error.message}`);
    }

    return data.data;
  }

  static async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (
          title,
          description,
          badge_image_url,
          points_value
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch achievements: ${error.message}`);
    }

    return data;
  }
}
```

---

## Testing Guidelines

### API Testing Framework
```typescript
// Jest Test Example
import { supabase } from '../supabaseClient';

describe('Enhanced Progress Tracking API', () => {
  test('should record block completion successfully', async () => {
    const completionData = {
      action: 'record_completion',
      user_id: 'test-user-123',
      block_id: 'test-block-456',
      completion_data: {
        completion_time: new Date().toISOString(),
        engagement_score: 85,
        time_spent_minutes: 12
      }
    };

    const { data, error } = await supabase.functions.invoke(
      'enhanced-progress-tracking',
      { body: completionData }
    );

    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.data.completion_id).toBeDefined();
    expect(data.data.engagement_score).toBe(85);
  });

  test('should handle invalid user_id gracefully', async () => {
    const invalidData = {
      action: 'record_completion',
      user_id: 'invalid-id',
      block_id: 'test-block-456'
    };

    const { data, error } = await supabase.functions.invoke(
      'enhanced-progress-tracking',
      { body: invalidData }
    );

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## Troubleshooting Guide

### Common Issues

#### 1. Authentication Errors
**Problem**: Getting 401 Unauthorized responses
**Solution**: 
```typescript
// Verify JWT token is valid and not expired
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Redirect to login or refresh token
  await supabase.auth.refreshSession();
}
```

#### 2. Multi-Tenant Data Issues
**Problem**: Users seeing data from other communitys
**Solution**: Ensure community_id is properly set in requests
```typescript
const headers = {
  'Authorization': `Bearer ${jwt}`,
  'x-community-id': userClientId // Critical for data isolation
};
```

#### 3. Performance Issues
**Problem**: Slow API responses
**Solutions**:
- Implement proper pagination
- Use selective field queries
- Cache frequently accessed data
- Monitor query performance in Supabase dashboard

#### 4. Progress Tracking Inconsistencies
**Problem**: Progress not updating correctly
**Solution**: Check for proper block completion sequencing
```typescript
// Ensure blocks are completed in proper sequence
const validateBlockSequence = async (courseId, blockId) => {
  const prerequisites = await getBlockPrerequisites(blockId);
  const userProgress = await getUserCourseProgress(courseId);
  
  return prerequisites.every(req => 
    userProgress.completed_blocks.includes(req)
  );
};
```

---

## Conclusion

This API documentation provides comprehensive coverage of all Phase 7 Progress Tracking endpoints. The APIs are designed for scalability, security, and ease of integration, supporting the full range of functionality required for enterprise-grade learning management systems.

### Key Features
- **Complete CRUD Operations**: Full lifecycle management for all entities
- **Multi-Tenant Architecture**: Enterprise-grade data isolation
- **Performance Optimized**: Sub-second response times for critical operations
- **Comprehensive Analytics**: Deep insights into learning patterns and outcomes
- **Flexible Achievement System**: Customizable gamification and recognition

For additional support or clarification, refer to the implementation examples provided or consult the Phase 7 Implementation Summary documentation.

---

**Document Information:**  
**Version:** 1.0  
**Last Updated:** September 13, 2025  
**Author:** MiniMax Agent  
**Status:** Production Ready  
**Related Documents:** Phase 7 Implementation Summary, Integration Guide, User Documentation