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
        const { communityId } = await req.json();
        
        if (!communityId) {
            throw new Error('Community ID is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Call the database function to generate signup link
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_community_signup_link`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ community_id: communityId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to generate signup link: ${errorText}`);
        }

        const signupLink = await response.text();
        
        return new Response(JSON.stringify({
            data: {
                signup_link: signupLink.replace(/"/g, ''), // Remove quotes from response
                community_id: communityId
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Generate signup link error:', error);

        const errorResponse = {
            error: {
                code: 'SIGNUP_LINK_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});