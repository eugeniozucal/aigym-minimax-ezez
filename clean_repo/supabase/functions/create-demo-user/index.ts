import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!supabaseServiceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Create or update demo user
    const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify({
        email: 'ez@weakity.com',
        password: '123456789',
        email_confirm: true,
        app_metadata: {
          role: 'admin'
        },
        user_metadata: {
          name: 'Demo User',
          role: 'admin'
        }
      })
    });

    const createUserData = await createUserResponse.json();
    
    if (!createUserResponse.ok && !createUserData.error?.message?.includes('already registered')) {
      throw new Error(`Failed to create user: ${createUserData.error?.message || 'Unknown error'}`);
    }

    // Get the user ID
    let userId = createUserData.id;
    
    // If user already exists, get their ID
    if (createUserData.error?.message?.includes('already registered')) {
      const getUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=ez@weakity.com`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseServiceRoleKey
        }
      });
      const users = await getUserResponse.json();
      userId = users.users?.[0]?.id;
    }

    if (!userId) {
      throw new Error('Could not determine user ID');
    }

    // Update password if user already exists
    const updatePasswordResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify({
        password: '123456789',
        app_metadata: {
          role: 'admin'
        },
        user_metadata: {
          name: 'Demo User',
          role: 'admin'
        }
      })
    });

    const updateData = await updatePasswordResponse.json();
    
    if (!updatePasswordResponse.ok) {
      console.log('Update error:', updateData);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Demo user ez@weakity.com created/updated with password 123456789',
      userId: userId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: {
        code: 'DEMO_USER_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
