import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { client_id, csv_data, file_name } = await req.json();

    if (!client_id || !csv_data) {
      throw new Error('Missing required parameters: client_id and csv_data');
    }

    // Parse CSV data
    const lines = csv_data.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['firstname', 'lastname', 'email'];
    
    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const results = {
      total_rows: lines.length - 1,
      successful_rows: 0,
      failed_rows: 0,
      errors: [],
      created_users: []
    };

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const rowData = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });

      try {
        // Validate required fields
        if (!rowData.firstname || !rowData.lastname || !rowData.email) {
          throw new Error('Missing required fields: firstName, lastName, or email');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rowData.email)) {
          throw new Error('Invalid email format');
        }

        // Generate secure password
        const password = generateSecurePassword();

        // Create user in Supabase Auth (if available)
        // For now, we'll just create in the users table
        const userData = {
          client_id,
          email: rowData.email,
          first_name: rowData.firstname,
          last_name: rowData.lastname,
          created_at: new Date().toISOString()
        };

        const { data: user, error: userError } = await supabaseClient
          .from('users')
          .insert([userData])
          .select()
          .single();

        if (userError) {
          if (userError.code === '23505') {
            throw new Error('Email already exists');
          }
          throw userError;
        }

        // Handle tags if provided
        if (rowData.tags) {
          const tagNames = rowData.tags.split(';').map(t => t.trim()).filter(t => t);
          
          for (const tagName of tagNames) {
            // Find or create tag
            let { data: tag } = await supabaseClient
              .from('user_tags')
              .select('id')
              .eq('client_id', client_id)
              .eq('name', tagName)
              .single();

            if (!tag) {
              const { data: newTag } = await supabaseClient
                .from('user_tags')
                .insert({
                  client_id,
                  name: tagName,
                  color: generateTagColor()
                })
                .select()
                .single();
              tag = newTag;
            }

            if (tag) {
              // Assign tag to user
              await supabaseClient
                .from('user_tag_assignments')
                .insert({
                  user_id: user.id,
                  tag_id: tag.id
                })
                .single();
            }
          }
        }

        results.successful_rows++;
        results.created_users.push({
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          temp_password: password
        });

      } catch (error) {
        results.failed_rows++;
        results.errors.push({
          row: i,
          email: rowData.email || 'Unknown',
          error: error.message
        });
      }
    }

    // Create bulk upload record
    await supabaseClient
      .from('bulk_uploads')
      .insert({
        client_id,
        upload_type: 'users',
        file_name: file_name || 'bulk_users.csv',
        total_rows: results.total_rows,
        successful_rows: results.successful_rows,
        failed_rows: results.failed_rows,
        status: results.failed_rows > 0 ? 'completed_with_errors' : 'completed',
        error_report: results.errors.length > 0 ? results.errors : null,
        created_by: 'system', // Would get from auth context in production
        completed_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ data: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing CSV upload:', error);
    
    const errorResponse = {
      error: {
        code: 'CSV_UPLOAD_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateTagColor(): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}