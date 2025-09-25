Deno.serve(async (req) => {
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
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check available environment variables
    const availableEnvVars = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'Available' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Available' : 'Missing',
      SUPABASE_ACCESS_TOKEN: Deno.env.get('SUPABASE_ACCESS_TOKEN') ? 'Available' : 'Missing',
      SUPABASE_PROJECT_ID: Deno.env.get('SUPABASE_PROJECT_ID')
    };
    
    console.log('Available environment variables:', availableEnvVars);

    // Try with service role key first
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (serviceRoleKey && supabaseUrl) {
      console.log('Using service role key approach');
      
      // Get user first to get their ID
      const getUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });
      
      if (!getUserResponse.ok) {
        const errorText = await getUserResponse.text();
        console.error('Failed to get users:', errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to get users', 
            details: errorText,
            env: availableEnvVars 
          }),
          { status: getUserResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const users = await getUserResponse.json();
      const targetUser = users.users?.find((u: any) => u.email === email);
      
      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'User not found', env: availableEnvVars }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Update user password
      const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({
          password: password
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.text();
        console.error('Failed to update password:', errorData);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update password', 
            details: errorData,
            env: availableEnvVars 
          }),
          { status: updateResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await updateResponse.json();
      
      return new Response(
        JSON.stringify({ success: true, data: result, method: 'service_role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fallback: return environment info for debugging
    return new Response(
      JSON.stringify({ 
        error: 'Service role key not available',
        env: availableEnvVars,
        message: 'Need to implement alternative method'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error updating password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
