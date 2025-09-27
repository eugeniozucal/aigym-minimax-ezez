# Community Signup Flow E2E Testing Guide

## Overview
This document provides comprehensive testing procedures for the multi-community signup link flow system.

## Testing Environment
- **Frontend URL**: https://e0ysmyzk4k8r.space.minimax.io
- **Supabase URL**: https://givgsxytkbsdrlmoxzkp.supabase.co
- **Edge Functions Base URL**: https://givgsxytkbsdrlmoxzkp.supabase.co/functions/v1/

## Test Scenarios

### 1. Admin Community Management

#### 1.1 Generate Signup Link
**Objective**: Verify admin can generate shareable signup links for communities

**Steps**:
1. Navigate to https://e0ysmyzk4k8r.space.minimax.io/login
2. Login with admin credentials
3. Navigate to Communities page
4. Click "Signup Link" button for any active community
5. Verify link is generated and copied to clipboard
6. Verify success message displays

**Expected Result**:
- Signup link generated in format: `https://e0ysmyzk4k8r.space.minimax.io/signup?community={token}`
- Link copied to clipboard
- Success notification shown

#### 1.2 Copy Existing Signup Link
**Objective**: Verify admin can copy previously generated signup links

**Steps**:
1. After generating a signup link (1.1)
2. Click the three-dot menu next to the community
3. Select "Copy Signup Link"
4. Verify link is copied to clipboard

**Expected Result**:
- Same signup link copied to clipboard
- Success notification shown

### 2. Community Membership Management

#### 2.1 View Community Members
**Objective**: Verify admin can view and manage community members

**Steps**:
1. From Communities page, click three-dot menu
2. Select "Manage Members"
3. Verify member list displays with roles
4. Verify search functionality works

**Expected Result**:
- Modal opens showing current members
- Members display with roles (member, moderator, admin)
- Search filters members correctly

#### 2.2 Add Users to Community
**Objective**: Verify admin can add existing users to communities

**Steps**:
1. In Community Membership modal, click "Add Users" tab
2. Select users from available list
3. Click "Add to Community"
4. Switch to "Members" tab to verify addition

**Expected Result**:
- Users successfully added to community
- Success message displayed
- New members appear in members list

#### 2.3 Update Member Roles
**Objective**: Verify admin can change member roles

**Steps**:
1. In Community Membership modal, Members tab
2. Change a member's role from dropdown
3. Verify role badge updates

**Expected Result**:
- Role successfully updated
- Success notification shown
- Role badge displays new role with appropriate icon

#### 2.4 Remove Members
**Objective**: Verify admin can remove members from communities

**Steps**:
1. In Community Membership modal, Members tab
2. Click remove button (minus icon) for a member
3. Confirm removal in dialog
4. Verify member is removed from list

**Expected Result**:
- Member successfully removed
- Success notification shown
- Member no longer appears in list

### 3. End-User Signup Flow

#### 3.1 Valid Signup Link Access
**Objective**: Verify end users can access signup page with valid links

**Steps**:
1. Use a generated signup link from test 1.1
2. Open link in incognito/private browser window
3. Verify community branding displays correctly
4. Verify form fields are present

**Expected Result**:
- Signup page loads successfully
- Community name and branding displayed
- Form fields: First Name, Last Name, Email, Password, Confirm Password
- Community-branded submit button

#### 3.2 Complete User Registration
**Objective**: Verify end users can successfully register through signup links

**Steps**:
1. On signup page from test 3.1
2. Fill in all required fields with valid data
3. Submit the form
4. Verify success page displays
5. Check email for verification

**Expected Result**:
- Form submission succeeds
- Success page shows community assignment
- Email verification sent
- User profile created with community association

#### 3.3 Invalid Signup Link Handling
**Objective**: Verify system handles invalid or expired links gracefully

**Steps**:
1. Navigate to signup page with invalid token: `https://e0ysmyzk4k8r.space.minimax.io/signup?community=invalid-token`
2. Verify error message displays
3. Verify redirect option to login page

**Expected Result**:
- Error page displays with clear message
- "Go to Login" button available
- No form displayed for invalid links

### 4. Multi-Community User Management

#### 4.1 View User Communities
**Objective**: Verify admin can see which communities each user belongs to

**Steps**:
1. Navigate to Users page
2. Find a user with multiple community memberships
3. Click "Communities" expand button
4. Verify all memberships display with roles and join dates

**Expected Result**:
- User's communities expand to show details
- Each membership shows community name, role, and join date
- Community branding (logo/color) displayed correctly

#### 4.2 Filter Users by Community
**Objective**: Verify admin can filter users by community membership

**Steps**:
1. On Users page, use community filter dropdown
2. Select a specific community
3. Verify only users belonging to that community are shown
4. Clear filter to show all users

**Expected Result**:
- User list filters correctly by community
- User count updates appropriately
- Filter can be cleared to show all users

### 5. Database Integrity Tests

#### 5.1 Junction Table Relationships
**Objective**: Verify user-community relationships are properly maintained

**Database Queries**:
```sql
-- Check user_communities table structure
SELECT * FROM user_communities LIMIT 5;

-- Verify multi-community memberships
SELECT user_id, COUNT(*) as community_count 
FROM user_communities 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Check RLS policies are working
SET ROLE authenticated;
SELECT * FROM user_communities;
```

**Expected Results**:
- Junction table contains proper relationships
- Users can belong to multiple communities
- RLS policies enforce proper access control

### 6. Security Testing

#### 6.1 Authentication Required
**Objective**: Verify protected routes require authentication

**Steps**:
1. Access admin pages without logging in
2. Verify redirect to login page
3. Attempt to access edge functions without proper tokens

**Expected Result**:
- Unauthenticated users redirected to login
- Protected API endpoints return 401/403 errors
- No sensitive data exposed to unauthorized users

#### 6.2 Role-Based Access Control
**Objective**: Verify users can only manage communities they have admin access to

**Steps**:
1. Login as non-admin user
2. Attempt to access community management features
3. Verify appropriate restrictions in place

**Expected Result**:
- Non-admin users cannot access management features
- RLS policies prevent unauthorized data access
- Error messages are user-friendly

### 7. Performance Testing

#### 7.1 Large Community Membership Lists
**Objective**: Verify system handles communities with many members

**Steps**:
1. Create test community with 100+ members
2. Open membership management modal
3. Verify reasonable load times
4. Test search and pagination if implemented

**Expected Result**:
- Page loads within 3 seconds
- Search responds quickly
- No browser memory issues

### 8. Edge Function Testing

#### 8.1 Community Signup Function
**Test URL**: `https://givgsxytkbsdrlmoxzkp.supabase.co/functions/v1/community-signup`

**Test Cases**:
- Generate signup link
- Validate signup token
- Complete signup process

#### 8.2 Community Membership Manager Function
**Test URL**: `https://givgsxytkbsdrlmoxzkp.supabase.co/functions/v1/community-membership-manager`

**Test Cases**:
- Add user to community
- Remove user from community
- Get community members
- Get user communities
- Update member role
- Bulk add users

#### 8.3 Generate Community Signup Link Function
**Test URL**: `https://givgsxytkbsdrlmoxzkp.supabase.co/functions/v1/generate-community-signup-link`

**Test Cases**:
- Generate new signup link
- Verify token uniqueness
- Verify URL format

## Test Data Requirements

### Communities
- At least 3 test communities with different configurations
- Mix of active and archived communities
- Communities with and without logos

### Users
- Test admin user with full permissions
- Test regular users with various community memberships
- Users with single and multiple community memberships

### Test Accounts
- Use `create_test_account` function to generate test users
- Create dedicated test email addresses for signup testing

## Automation Opportunities

### Playwright/Cypress Tests
- Automate signup flow end-to-end
- Test form validation
- Test error scenarios
- Performance monitoring

### API Testing
- Edge function integration tests
- Database consistency checks
- Security vulnerability scans

## Success Criteria

✅ **Complete Flow**: Admin can generate signup links, end users can register, and are properly assigned to communities

✅ **Multi-Community Support**: Users can belong to multiple communities with different roles

✅ **Admin Management**: Comprehensive membership management with bulk operations

✅ **Security**: Proper authentication, authorization, and data protection

✅ **User Experience**: Intuitive interface with clear feedback and error handling

✅ **Performance**: Reasonable load times and responsive interactions

✅ **Data Integrity**: Consistent database state and proper relationship management

## Issue Reporting

When reporting issues, include:
1. Test scenario being executed
2. Specific steps taken
3. Expected vs actual results
4. Browser/device information
5. Screenshots or error messages
6. Network requests/responses if relevant

## Deployment Information

- **Production URL**: https://e0ysmyzk4k8r.space.minimax.io
- **Database**: Supabase PostgreSQL with RLS enabled
- **Edge Functions**: Deployed on Supabase Edge Runtime
- **CDN**: Distributed via MiniMax infrastructure

---

*Last Updated: 2025-09-25*
*Testing Environment: Production*