import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-community-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface CSVRow {
  firstName: string
  lastName: string
  email: string
  tags?: string
}

interface BulkUploadRequest {
  communityId: string
  csvData: string
  fileName: string
}

function generatePassword(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function parseCSV(csvData: string): CSVRow[] {
  const lines = csvData.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: CSVRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    if (values.length >= 3) {
      const row: CSVRow = {
        firstName: values[headers.indexOf('firstname') || 0] || '',
        lastName: values[headers.indexOf('lastname') || 1] || '',
        email: values[headers.indexOf('email') || 2] || '',
        tags: values[headers.indexOf('tags') || 3] || ''
      }
      rows.push(row)
    }
  }
  
  return rows
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { communityId, csvData, fileName }: BulkUploadRequest = await req.json()
    
    // Parse CSV data
    const rows = parseCSV(csvData)
    
    if (rows.length === 0) {
      throw new Error('No valid data found in CSV')
    }

    // Get admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Create bulk upload record
    const { data: uploadRecord, error: uploadError } = await supabase
      .from('bulk_uploads')
      .insert({
        community_id: communityId,
        upload_type: 'users',
        file_name: fileName,
        total_rows: rows.length,
        created_by: user.id
      })
      .select()
      .single()

    if (uploadError) throw uploadError

    // Get community tags for validation
    const { data: communityTags } = await supabase
      .from('user_tags')
      .select('*')
      .eq('community_id', communityId)

    const tagMap = new Map()
    communityTags?.forEach(tag => {
      tagMap.set(tag.name.toLowerCase(), tag.id)
    })

    const successfulUsers: any[] = []
    const failedRows: any[] = []
    
    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because of header and 0-based index
      
      try {
        // Validate required fields
        if (!row.email || !row.firstName || !row.lastName) {
          throw new Error('Missing required fields: firstName, lastName, or email')
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(row.email)) {
          throw new Error('Invalid email format')
        }

        // Generate password
        const password = generatePassword()
        const passwordHash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(password)
        )
        const hashedPassword = Array.from(new Uint8Array(passwordHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

        // Create user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            community_id: communityId,
            email: row.email.toLowerCase(),
            first_name: row.firstName,
            last_name: row.lastName,
            password_hash: hashedPassword
          })
          .select()
          .single()

        if (userError) {
          if (userError.code === '23505') { // Unique constraint violation
            throw new Error('Email already exists for this community')
          }
          throw userError
        }

        // Process tags if provided
        const userTags: string[] = []
        if (row.tags) {
          const tagNames = row.tags.split(';').map(t => t.trim().toLowerCase())
          for (const tagName of tagNames) {
            if (tagMap.has(tagName)) {
              userTags.push(tagMap.get(tagName))
            }
          }
        }

        // Assign tags to user
        if (userTags.length > 0) {
          const tagAssignments = userTags.map(tagId => ({
            user_id: newUser.id,
            tag_id: tagId,
            assigned_by: user.id
          }))

          await supabase
            .from('user_tag_assignments')
            .insert(tagAssignments)
        }

        successfulUsers.push({
          ...newUser,
          password: password, // Include generated password in response
          tags: userTags
        })

      } catch (error) {
        failedRows.push({
          row: rowNumber,
          data: row,
          error: error.message
        })
      }
    }

    // Update bulk upload record with results
    await supabase
      .from('bulk_uploads')
      .update({
        successful_rows: successfulUsers.length,
        failed_rows: failedRows.length,
        status: failedRows.length === 0 ? 'completed' : 'completed',
        error_report: failedRows.length > 0 ? failedRows : null,
        completed_at: new Date().toISOString()
      })
      .eq('id', uploadRecord.id)

    return new Response(JSON.stringify({
      uploadId: uploadRecord.id,
      totalRows: rows.length,
      successfulRows: successfulUsers.length,
      failedRows: failedRows.length,
      successfulUsers: successfulUsers,
      errors: failedRows
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Bulk Upload Error:', error)
    
    return new Response(JSON.stringify({
      error: {
        code: 'BULK_UPLOAD_ERROR',
        message: error.message || 'Failed to process bulk upload'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})