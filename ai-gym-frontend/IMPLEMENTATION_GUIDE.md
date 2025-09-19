# AI GYM Enterprise Database - Implementation Guide

## Overview

This implementation guide provides step-by-step instructions for deploying the enterprise database architecture for AI GYM. The deployment resolves the critical system failures while establishing a world-class, scalable foundation.

## Prerequisites

### Environment Requirements
- PostgreSQL 14+ (Supabase managed)
- Node.js 18+ (for application integration)
- psql command-line tool
- Git (for version control)

### Required Environment Variables
```bash
# Database connection
DATABASE_URL="postgresql://postgres:password@host:5432/database"

# Supabase configuration  
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Application settings
NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
```

### Access Requirements
- Database admin access (for schema deployment)
- Supabase project admin access
- Application deployment access

## Deployment Phases

### Phase 1: Emergency Stabilization (Week 1-2)

#### Step 1: Prepare Environment

```bash
# Clone the repository
git clone <repository-url>
cd ai-gym-database

# Make deployment script executable
chmod +x deploy-enterprise-schema.sh

# Set environment variables
export DATABASE_URL="your-database-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### Step 2: Deploy Emergency Schema

```bash
# Create backup and deploy schema
./deploy-enterprise-schema.sh deploy
```

This will:
- Create a backup of the current database
- Deploy the enterprise schema (001_create_enterprise_schema.sql)
- Create performance indexes (002_create_indexes.sql)  
- Apply RLS policies (003_create_rls_policies.sql)
- Verify the deployment

#### Step 3: Verify Deployment

```bash
# Verify schema deployment
./deploy-enterprise-schema.sh verify

# Check system health
psql "$DATABASE_URL" -c "SELECT * FROM system_health_check();"

# Monitor performance
psql "$DATABASE_URL" -c "SELECT * FROM performance_summary LIMIT 10;"
```

### Phase 2: Authentication Migration (Week 3-4)

#### Step 1: Migrate Existing Users

```sql
-- Connect to database
psql "$DATABASE_URL"

-- Create staging area for legacy data
CREATE SCHEMA IF NOT EXISTS migration_staging;

-- Export legacy users (if they exist)
CREATE TABLE migration_staging.legacy_users AS
SELECT * FROM public.users WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1);

-- Export legacy admins (if they exist)  
CREATE TABLE migration_staging.legacy_admins AS
SELECT * FROM public.admins WHERE EXISTS (SELECT 1 FROM public.admins LIMIT 1);
```

#### Step 2: Application Integration

Update your application to use the new authentication system:

```javascript
// supabase.js - Update community configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// auth/AuthContext.js - Update authentication context
import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### Phase 3: Feature Restoration (Week 5-6)

#### Step 1: Deploy AI Conversation System

The conversation system is ready to use. Create a conversation:

```javascript
// Create new conversation
const createConversation = async (aiAgentId) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      ai_agent_id: aiAgentId,
      title: 'New Conversation',
      status: 'active'
    })
    .select()
    .single()
  
  return { data, error }
}

// Add message to conversation
const addMessage = async (conversationId, role, content) => {
  const { data, error } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      sequence_number: await getNextSequenceNumber(conversationId)
    })
    .select()
    .single()
  
  return { data, error }
}
```

#### Step 2: Deploy Content Management

Content management is available through the unified content_items table:

```javascript
// Get content by repository
const getContentByRepository = async (repositoryName) => {
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      *,
      content_repositories!inner(
        name,
        display_name
      )
    `)
    .eq('content_repositories.name', repositoryName)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
  
  return { data, error }
}

// Create new content item
const createContentItem = async (repositoryId, title, contentData) => {
  const { data, error } = await supabase
    .from('content_items')
    .insert({
      repository_id: repositoryId,
      title,
      content_data: contentData,
      status: 'draft'
    })
    .select()
    .single()
  
  return { data, error }
}
```

## Monitoring and Maintenance

### Performance Monitoring

```sql
-- Daily performance check
SELECT * FROM check_performance_alerts();

-- Weekly maintenance
SELECT automated_maintenance();

-- Monthly index analysis
SELECT * FROM suggest_missing_indexes();
SELECT * FROM unused_indexes WHERE pg_relation_size(indexrelid) > 1024*1024; -- > 1MB
```

### Backup Verification

```sql
-- Verify backup integrity
SELECT * FROM verify_backup_integrity();

-- Export organization data
SELECT export_organization_data('org-uuid-here');
```

## Troubleshooting

### Common Issues

#### Issue: RLS Policy Blocking Access
```sql
-- Temporarily disable RLS for debugging (DO NOT use in production)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Check user role and organization
SELECT 
    up.id,
    up.email,
    up.role,
    up.organization_id,
    o.name as org_name
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE up.id = auth.uid();
```

#### Issue: Slow Query Performance
```sql
-- Analyze slow queries
SELECT * FROM performance_summary WHERE mean_time > 100;

-- Check index usage
SELECT * FROM table_performance WHERE index_usage_percent < 50;
```

#### Issue: Connection Limits
```sql
-- Check active connections
SELECT 
    count(*) as active_connections,
    state,
    application_name
FROM pg_stat_activity 
GROUP BY state, application_name
ORDER BY count(*) DESC;
```

### Emergency Procedures

#### Emergency Rollback
```bash
# Complete rollback to backup
./deploy-enterprise-schema.sh rollback

# Emergency schema drop (DESTRUCTIVE)
./deploy-enterprise-schema.sh emergency-rollback
```

#### Emergency RLS Disable
```sql
-- Only use in emergencies - disables all security
SELECT emergency_rollback();
```

## Testing Procedures

### Automated Testing

```javascript
// Test suite for database integration
describe('Database Integration Tests', () => {
  test('User can create and access own content', async () => {
    // Test content creation and RLS policies
  })
  
  test('Conversations work correctly', async () => {
    // Test conversation creation and message flow
  })
  
  test('Organization isolation works', async () => {
    // Test that users can only see org content
  })
})
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Profile creation and updates
- [ ] Content creation in each repository
- [ ] Content assignment to users/organizations
- [ ] Conversation creation and messaging
- [ ] Organization switching (if applicable)
- [ ] Admin functions and permissions
- [ ] Performance under load
- [ ] RLS policy enforcement
- [ ] Backup and restore procedures

## Success Criteria

### Performance Targets
- Page load time: < 3 seconds (95th percentile)
- API response time: < 1 second (99th percentile)
- Database query time: < 100ms (95th percentile)
- RLS policy execution: < 10ms (95th percentile)

### Functional Targets
- All 5 content repositories operational
- Multi-turn AI conversations working
- User and organization management functional
- Content assignment system operational
- Analytics and reporting available

### Security Targets
- All RLS policies implemented and tested
- User data isolation verified
- Admin permissions working correctly
- Audit trail capturing all changes
- No data leakage between organizations

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor performance alerts
- Check system health
- Review error logs

**Weekly:**
- Run automated maintenance
- Review slow queries
- Check backup integrity

**Monthly:**
- Analyze index usage
- Review security policies
- Performance optimization

**Quarterly:**
- Full security audit
- Disaster recovery testing
- Capacity planning review

For additional support, refer to the comprehensive enterprise database architecture specification and contact the development team.