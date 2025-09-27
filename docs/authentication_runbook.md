# Authentication System Runbook

**System:** AI GYM Platform Authentication  
**Architecture:** React SPA + Supabase Authentication  
**Last Updated:** 2025-09-27 16:52:34

## 📊 System Overview

### Authentication Flow
1. **Frontend:** React SPA handles UI and routing
2. **Authentication:** Supabase manages user credentials and sessions
3. **Authorization:** Custom role-based access control via database tables
4. **Data Scoping:** Community membership determines data visibility

### Key Components
- **`auth.users`** - Supabase authentication (credentials, email confirmation)
- **`user_roles`** - Custom role assignment (admin vs community_user)
- **`user_communities`** - Community membership and data scoping
- **`profiles`** - User profile information
- **`communities`** - Community definitions and settings

## 📜 Database Schema

### User Authentication Tables
```sql
-- Supabase managed authentication
auth.users {
  id: UUID (primary key)
  email: VARCHAR
  raw_user_meta_data: JSONB
  email_confirmed_at: TIMESTAMP
  created_at: TIMESTAMP
}

-- Custom role management
user_roles {
  id: UUID (primary key)
  user_id: UUID (references auth.users.id)
  role: VARCHAR ('admin' | 'community_user')
  community_id: UUID (references communities.id, NULL for admins)
  assigned_at: TIMESTAMP
  assigned_by: UUID (references auth.users.id)
  is_active: BOOLEAN
}

-- Community membership
user_communities {
  id: UUID (primary key)
  user_id: UUID (references profiles.id)
  community_id: UUID (references communities.id)
  role: VARCHAR ('member', 'admin', etc.)
  joined_at: TIMESTAMP
  signup_token: VARCHAR (for community link signups)
}

-- User profiles (required for foreign key constraints)
profiles {
  id: UUID (primary key, matches auth.users.id)
  email: VARCHAR
  first_name: VARCHAR
  last_name: VARCHAR
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

## 🔑 User Types & Access Patterns

### 1. Super Admin Users
- **Role:** `user_roles.role = 'admin'`
- **Community:** `user_roles.community_id = NULL`
- **Access:** Full system access, all communities
- **Landing Page:** `/dashboard`
- **Metadata Example:**
  ```json
  {
    "role": "admin",
    "is_admin": true,
    "admin_role": "super_admin",
    "email_verified": true
  }
  ```

### 2. Community Users
- **Role:** `user_roles.role = 'community_user'`
- **Community:** `user_roles.community_id = [specific_community_id]`
- **Access:** Limited to assigned community data
- **Landing Page:** `/user/community`
- **Metadata Example:**
  ```json
  {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "community_id": "b7ae9b47-3fe9-4f48-abc2-251fd3b19dc8",
    "email_verified": true
  }
  ```

## 🔄 User Lifecycle Management

### Creating New Admin Users
```sql
-- 1. User signs up via Supabase Auth (done automatically)
-- 2. Add to user_roles table
INSERT INTO user_roles (user_id, role, community_id, assigned_by, is_active)
VALUES (
  '[new_user_id]',
  'admin',
  NULL,
  '[admin_who_assigned]',
  true
);

-- 3. Create profile if not exists
INSERT INTO profiles (id, email, first_name, last_name)
VALUES ('[new_user_id]', '[email]', '[first_name]', '[last_name]');
```

### Creating New Community Users
```sql
-- 1. User signs up via Supabase Auth (done automatically)
-- 2. Add to user_roles table
INSERT INTO user_roles (user_id, role, community_id, assigned_by, is_active)
VALUES (
  '[new_user_id]',
  'community_user',
  '[community_id]',
  '[admin_who_assigned]',
  true
);

-- 3. Create profile
INSERT INTO profiles (id, email, first_name, last_name)
VALUES ('[new_user_id]', '[email]', '[first_name]', '[last_name]');

-- 4. Add to community membership
INSERT INTO user_communities (user_id, community_id, role, joined_at)
VALUES (
  '[new_user_id]',
  '[community_id]',
  'member',
  NOW()
);
```

### Community Link Signups
```sql
-- Users who sign up via community links will have:
-- 1. signup_token in user_communities table
-- 2. community_id in auth.users.raw_user_meta_data
-- 3. Automatic role assignment to community_user

-- Example query to find community link signups:
SELECT u.email, uc.signup_token, c.name as community_name
FROM auth.users u
JOIN user_communities uc ON u.id = uc.user_id
JOIN communities c ON uc.community_id = c.id
WHERE uc.signup_token IS NOT NULL;
```

## 🔍 Troubleshooting Common Issues

### Issue: User Can't Log In
**Check:**
1. Email confirmed: `auth.users.email_confirmed_at IS NOT NULL`
2. User exists: `SELECT * FROM auth.users WHERE email = '[email]'`
3. Correct password being used
4. Account not disabled

### Issue: User Gets Wrong Dashboard
**Check:**
1. Role assignment: `SELECT role FROM user_roles WHERE user_id = '[user_id]'`
2. Role conflicts: Multiple active roles for same user
3. Community assignment for community users

### Issue: Community User Sees Wrong Data
**Check:**
1. Community membership: `user_communities` table
2. Community ID in `user_roles` matches `user_communities`
3. Data scoping queries use correct community_id

### Issue: Infinite Login Loops
**Usually caused by:**
1. Role assignment conflicts (admin role with community_id)
2. Missing profile records
3. Frontend routing logic errors

**Fix:**
```sql
-- Check for role conflicts
SELECT ur.role, ur.community_id, uc.community_id as membership_community
FROM user_roles ur
LEFT JOIN user_communities uc ON ur.user_id = uc.user_id
WHERE ur.user_id = '[user_id]';

-- Fix role conflicts
UPDATE user_roles 
SET role = 'community_user', community_id = '[correct_community_id]'
WHERE user_id = '[user_id]' AND role = 'admin' AND community_id IS NOT NULL;
```

## 🗺️ Development Workflow

### Adding New Authentication Features
1. **Database Changes:** Update schema in migrations
2. **Backend Logic:** Update Supabase edge functions if needed
3. **Frontend Integration:** Update React components and routing
4. **Testing:** Validate with test users in each role

### Testing Authentication Changes
1. **Create test users** for each role type
2. **Test login flows** for all user types
3. **Verify role-based access** control
4. **Check data scoping** works correctly
5. **Test session persistence** and logout

### Monitoring Authentication Health
```sql
-- Users without profiles (potential issue)
SELECT u.email, u.id 
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id 
WHERE p.id IS NULL;

-- Users without role assignments
SELECT u.email, u.id
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Community users without community membership
SELECT u.email, ur.role
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN user_communities uc ON u.id = uc.user_id
WHERE ur.role = 'community_user' AND uc.user_id IS NULL;
```

## 📦 Deployment Considerations

### Environment Variables
- **SUPABASE_URL:** Project URL
- **SUPABASE_ANON_KEY:** Public API key
- **SUPABASE_SERVICE_ROLE_KEY:** Admin operations (server-side only)

### Frontend Build
- **Static Assets:** Deploy React build to CDN/hosting
- **Client-Side Routing:** Configure server to serve index.html for all routes
- **Environment Config:** Embed Supabase config in build

### Database Setup
- **RLS Policies:** Ensure Row Level Security is enabled
- **User Permissions:** Configure appropriate database permissions
- **Indexes:** Add indexes for performance on auth-related queries

---

**For Support:** Refer to Supabase documentation and React Router guides  
**For Issues:** Check authentication logs and database integrity first
