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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Basic health checks
        const checks = [];
        const startTime = Date.now();

        // Database connectivity check
        try {
            const dbResponse = await fetch(`${supabaseUrl}/rest/v1/admins?select=count&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                },
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            checks.push({
                service: 'database',
                status: dbResponse.ok ? 'healthy' : 'unhealthy',
                response_time: Date.now() - startTime,
                error: dbResponse.ok ? null : await dbResponse.text()
            });
        } catch (error) {
            checks.push({
                service: 'database',
                status: 'unhealthy',
                response_time: Date.now() - startTime,
                error: error.message
            });
        }

        // Auth service check
        const authStartTime = Date.now();
        try {
            const authResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
                headers: {
                    'apikey': serviceRoleKey
                },
                signal: AbortSignal.timeout(5000)
            });
            
            checks.push({
                service: 'auth',
                status: authResponse.ok ? 'healthy' : 'unhealthy',
                response_time: Date.now() - authStartTime,
                error: authResponse.ok ? null : await authResponse.text()
            });
        } catch (error) {
            checks.push({
                service: 'auth',
                status: 'unhealthy',
                response_time: Date.now() - authStartTime,
                error: error.message
            });
        }

        // Storage service check
        const storageStartTime = Date.now();
        try {
            const storageResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                },
                signal: AbortSignal.timeout(5000)
            });
            
            checks.push({
                service: 'storage',
                status: storageResponse.ok ? 'healthy' : 'unhealthy',
                response_time: Date.now() - storageStartTime,
                error: storageResponse.ok ? null : await storageResponse.text()
            });
        } catch (error) {
            checks.push({
                service: 'storage',
                status: 'unhealthy',
                response_time: Date.now() - storageStartTime,
                error: error.message
            });
        }

        // Overall system status
        const unhealthyServices = checks.filter(check => check.status === 'unhealthy');
        const overallStatus = unhealthyServices.length === 0 ? 'healthy' : 
                              unhealthyServices.length < checks.length ? 'degraded' : 'unhealthy';

        const totalResponseTime = Date.now() - startTime;

        return new Response(JSON.stringify({
            data: {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                total_response_time: totalResponseTime,
                services: checks,
                summary: {
                    healthy_services: checks.filter(c => c.status === 'healthy').length,
                    total_services: checks.length,
                    average_response_time: Math.round(checks.reduce((sum, c) => sum + c.response_time, 0) / checks.length)
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: overallStatus === 'healthy' ? 200 : 503
        });

    } catch (error) {
        console.error('System health check error:', error);

        const errorResponse = {
            error: {
                code: 'HEALTH_CHECK_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});