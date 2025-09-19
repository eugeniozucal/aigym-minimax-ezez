# WOD Loading Debug Analysis - Phase 2: Code-Level Investigation

## Executive Summary
Through Phase 1 E2E testing, we discovered that WOD saving works correctly (data persists to database), but the loading mechanism fails with "Failed to load WOD" error. This analysis identifies the root cause through code examination.

## Database Schema Analysis

### WODs Table Structure
```sql
-- Original schema (from missions table)
CREATE TABLE wods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    estimated_duration_minutes INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[] DEFAULT '{}',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Added later (migration 1758138200)
ALTER TABLE wods 
ADD COLUMN IF NOT EXISTS pages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
```

## Code Flow Analysis

### 1. Frontend Loading Logic (PageBuilder.tsx)

**Location:** `/workspace/ai-gym-frontend/src/components/shared/PageBuilder.tsx`

**Key Function:** `loadPageData()` (lines 92-184)

```typescript
const loadPageData = async (pageId: string) => {
  try {
    setLoading(true)
    
    // API call construction
    const url = `${config.api}?id=${pageId}` // Line 99
    const { data, error } = await supabase.functions.invoke(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (error) {
      throw new Error(error.message || 'Failed to fetch data') // Line 108
    }

    // Data validation
    if (!data?.data) {
      throw new Error('Data not found') // Line 114
    }

    // Data extraction
    const itemData = Array.isArray(data.data) 
      ? data.data[0]
      : data.data // Lines 118-120

    if (!itemData) {
      throw new Error('Item not found') // Line 125
    }

    // Page data construction
    const loadedPageData = {
      id: itemData.id,
      title: itemData.title || `Sample ${config.name}`,
      description: itemData.description || `A sample ${config.name} for testing`,
      // ... more fields
      pages: itemData.pages || [{ /* default page */ }], // Line 137
      settings: itemData.settings || { /* default settings */ } // Line 143
    }
    
    setPageData(loadedPageData)
  } catch (err) {
    setError(`Failed to load ${config.name}`) // Line 180
  } finally {
    setLoading(false)
  }
}
```

### 2. Backend API Logic (wods-api/index.ts)

**Location:** `/workspace/supabase/functions/wods-api/index.ts`

**Key Section:** GET method (lines 31-61)

```typescript
if (method === 'GET') {
  let apiUrl;
  if (wodId) {
    // Get specific WOD
    apiUrl = `${supabaseUrl}/rest/v1/wods?id=eq.${wodId}`; // Line 35
  } else {
    // Get all WODs
    apiUrl = `${supabaseUrl}/rest/v1/wods?order=created_at.desc`;
  }

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Database query failed: ${errorText}`); // Line 51
  }

  const data = await response.json();
  
  return new Response(JSON.stringify({ 
    data: wodId ? (data[0] || null) : data  // Line 57
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

## Root Cause Identification

### Primary Issue: Data Structure Mismatch

Based on Phase 1 evidence and code analysis, the issue appears to be:

1. **API Call Success**: The Supabase REST API call succeeds and returns data
2. **Data Parsing Issue**: The data structure returned doesn't match frontend expectations
3. **Error Masking**: The generic "Failed to load WOD" message masks the specific problem

### Specific Problem Points:

#### 1. JSONB Column Handling
The `pages` and `settings` columns are JSONB fields that might not be properly serialized/deserialized:

```typescript
// Frontend expects (Line 137-143)
pages: itemData.pages || [{ id: 'page-1', title: 'Page 1', blocks: [], order: 0 }]
settings: itemData.settings || { /* default settings object */ }
```

#### 2. Array vs Object Confusion
```typescript
// Line 118-120: This logic might be flawed
const itemData = Array.isArray(data.data) 
  ? data.data[0]  // Take first item if array
  : data.data      // Use directly if single object
```

#### 3. Null/Undefined Handling
When a WOD exists but has null `pages` or `settings`, the fallback logic might fail.

## Debug Strategy

### Console Log Analysis Required
We need to examine what the API actually returns vs. what the frontend expects:

1. **Database Query Result**: What does `SELECT * FROM wods WHERE id = 'xxx'` return?
2. **API Response**: What does the wods-api function return?
3. **Frontend Parsing**: What does `itemData` contain after parsing?

### Potential Fix Areas

#### 1. Backend API Enhancement
```typescript
// Add better error handling and logging
console.log('Raw database response:', data);
console.log('Processed response:', wodId ? (data[0] || null) : data);
```

#### 2. Frontend Data Validation
```typescript
// Add more specific error messages
if (!data?.data) {
  throw new Error(`No data returned from API. Response: ${JSON.stringify(data)}`)
}

console.log('API Response:', data);
console.log('Item Data:', itemData);
console.log('Pages field:', itemData?.pages);
console.log('Settings field:', itemData?.settings);
```

#### 3. JSONB Field Handling
Ensure JSONB fields are properly parsed:
```typescript
// Handle JSONB fields explicitly
const pages = typeof itemData.pages === 'string' 
  ? JSON.parse(itemData.pages) 
  : itemData.pages || [{ /* default */ }];
```

## Next Steps for Resolution

### Phase 3: Live Debugging
1. **Add Console Logging**: Insert detailed logging in both frontend and backend
2. **Test with Known WOD ID**: Use the ID from Phase 1 (`90dcd58c-0967-4af6-867d-e9fa07e60620`)
3. **Database Direct Query**: Verify what's actually stored in the database
4. **API Response Validation**: Confirm the exact response structure

### Phase 4: Implementation
1. **Fix Identified Issues**: Based on Phase 3 findings
2. **Add Error Specificity**: Replace generic error messages with specific ones
3. **Comprehensive Testing**: Verify fix works for create/edit/view workflow

## Critical Files for Fix Implementation

1. **Frontend**: `/workspace/ai-gym-frontend/src/components/shared/PageBuilder.tsx` (loadPageData function)
2. **Backend**: `/workspace/supabase/functions/wods-api/index.ts` (GET method)
3. **Database**: Ensure JSONB columns have proper default values

## Conclusion

The root cause is likely a data parsing or structure mismatch between what the database stores, what the API returns, and what the frontend expects. The save functionality works because it's a simpler write operation, but the read operation involves complex data transformation that's failing silently and being masked by generic error handling.
