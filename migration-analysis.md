# Authentication Context Migration Analysis

## Current Status
- **Primary Provider**: BulletproofAuthContext (used in App.tsx)
- **Legacy Provider**: AuthContext (imported by many components)

## Interface Comparison

### AuthContext Interface:
```typescript
interface AuthContextType {
  user: User | null                    // Supabase User
  admin: Admin | null                  // Admin object
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  getUserType: () => 'admin' | 'community' | 'unknown'
  getPostLoginRoute: () => string
}
```

### BulletproofAuthContext Interface:
```typescript
interface AuthContextType {
  user: UserWithRole | null            // Enhanced user with role
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  signOut: () => Promise<void>
  hasPermission: (permission: 'admin' | 'community_access' | 'role_management') => Promise<boolean>
  refreshUser: () => Promise<void>
  validateRouteAccess: (route: string) => Promise<{ hasAccess: boolean; redirectTo?: string; userRole?: string }>
}
```

## Migration Requirements

### Missing in BulletproofAuthContext:
1. `admin` property (separate admin object)
2. `getUserType()` method
3. `getPostLoginRoute()` method

### Missing in AuthContext:
1. `hasPermission()` method
2. `refreshUser()` method  
3. `validateRouteAccess()` method
4. Enhanced `signIn` with success flag and redirectTo

## Migration Strategy:
1. Enhance BulletproofAuthContext with missing methods for compatibility
2. Update all components to import from BulletproofAuthContext
3. Remove old AuthContext
4. Test compatibility

## Components to Migrate:
- ProtectedRoute.tsx
- Layout components (Header.tsx, ModernHeader.tsx)
- User components (WriteBox.tsx, UserHeader.tsx, etc.)
- Content editors (ImageEditor.tsx, PDFEditor.tsx, etc.) 
- User pages (CommunityPage.tsx, TrainingZonePage.tsx)
- Logout.tsx
