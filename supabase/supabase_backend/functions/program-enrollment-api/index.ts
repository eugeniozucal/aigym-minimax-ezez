Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-community-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const method = req.method;
        const pathParts = url.pathname.split('/').filter(Boolean);
        const enrollmentId = pathParts[pathParts.length - 1];
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Authentication required for all operations
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authentication required');
        }
        
        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });
        
        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }
        
        const userData = await userResponse.json();
        const userId = userData.id;

        // Get current community (for multi-tenancy)
        const communityId = req.headers.get('x-community-id');
        if (!communityId) {
            throw new Error('Community ID required');
        }

        switch (method) {
            case 'GET':
                if (enrollmentId && enrollmentId !== 'program-enrollment-api') {
                    // Get specific enrollment with detailed information
                    const selectFields = `
                        *,
                        programs(
                            id,
                            title,
                            description,
                            thumbnail_url,
                            program_type,
                            difficulty_level,
                            estimated_duration_hours,
                            certificate_available,
                            course_sequence
                        ),
                        users(
                            id,
                            first_name,
                            last_name,
                            email
                        )
                    `;
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/program_enrollments?id=eq.${enrollmentId}&select=${selectFields}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch enrollment');
                    }
                    
                    const enrollments = await response.json();
                    if (enrollments.length === 0) {
                        throw new Error('Enrollment not found');
                    }
                    
                    return new Response(JSON.stringify({ data: enrollments[0] }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                } else {
                    // List enrollments with filtering
                    const searchParams = new URLSearchParams(url.search);
                    const programId = searchParams.get('program_id');
                    const targetUserId = searchParams.get('user_id');
                    const status = searchParams.get('status');
                    const limit = parseInt(searchParams.get('limit') || '50');
                    const offset = parseInt(searchParams.get('offset') || '0');
                    const myEnrollments = searchParams.get('my_enrollments') === 'true';
                    
                    let query = `select=*,programs(id,title,description,thumbnail_url,program_type,difficulty_level)&limit=${limit}&offset=${offset}&order=enrolled_at.desc`;
                    
                    // Add filters
                    const filters = [`community_id=eq.${communityId}`];
                    
                    if (myEnrollments) {
                        filters.push(`user_id=eq.${userId}`);
                    } else if (targetUserId) {
                        filters.push(`user_id=eq.${targetUserId}`);
                    }
                    
                    if (programId) {
                        filters.push(`program_id=eq.${programId}`);
                    }
                    if (status && status !== 'all') {
                        filters.push(`status=eq.${status}`);
                    }
                    
                    query += `&${filters.join('&')}`;
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/program_enrollments?${query}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch enrollments');
                    }
                    
                    const enrollments = await response.json();
                    return new Response(JSON.stringify({ data: enrollments }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

            case 'POST':
                const enrollmentData = await req.json();
                
                // Handle bulk enrollment
                if (enrollmentData.bulk_enrollment && enrollmentData.user_ids) {
                    const { program_id, user_ids, enrollment_source = 'admin_assigned' } = enrollmentData;
                    
                    if (!program_id || !user_ids || !Array.isArray(user_ids)) {
                        throw new Error('Program ID and user IDs array required for bulk enrollment');
                    }
                    
                    // Verify program exists and user has permission
                    const programResponse = await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${program_id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });
                    
                    if (!programResponse.ok) {
                        throw new Error('Program not found or access denied');
                    }
                    
                    const programs = await programResponse.json();
                    if (programs.length === 0) {
                        throw new Error('Program not found');
                    }
                    
                    // Create enrollment records
                    const enrollments = user_ids.map(user_id => ({
                        program_id,
                        user_id,
                        community_id: communityId,
                        status: 'active',
                        enrollment_source,
                        assigned_by: userId,
                        enrolled_at: new Date().toISOString()
                    }));
                    
                    const bulkResponse = await fetch(`${supabaseUrl}/rest/v1/program_enrollments`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(enrollments)
                    });
                    
                    if (!bulkResponse.ok) {
                        const errorText = await bulkResponse.text();
                        throw new Error(`Failed to create bulk enrollments: ${errorText}`);
                    }
                    
                    const createdEnrollments = await bulkResponse.json();
                    return new Response(JSON.stringify({ 
                        data: createdEnrollments,
                        summary: {
                            total_requested: user_ids.length,
                            total_created: createdEnrollments.length,
                            program_id
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                } else {
                    // Single enrollment
                    const { program_id, target_user_id } = enrollmentData;
                    const enrollUserId = target_user_id || userId; // Allow enrolling others if specified
                    
                    if (!program_id) {
                        throw new Error('Program ID required');
                    }
                    
                    // Check for existing enrollment
                    const existingResponse = await fetch(
                        `${supabaseUrl}/rest/v1/program_enrollments?program_id=eq.${program_id}&user_id=eq.${enrollUserId}&community_id=eq.${communityId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    
                    if (existingResponse.ok) {
                        const existing = await existingResponse.json();
                        if (existing.length > 0) {
                            throw new Error('User is already enrolled in this program');
                        }
                    }
                    
                    // Verify program exists and check prerequisites
                    const programResponse = await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${program_id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });
                    
                    if (!programResponse.ok) {
                        throw new Error('Program not found or access denied');
                    }
                    
                    const programs = await programResponse.json();
                    if (programs.length === 0) {
                        throw new Error('Program not found');
                    }
                    
                    const program = programs[0];
                    
                    // Check enrollment capacity
                    if (program.enrollment_capacity) {
                        const enrollmentCountResponse = await fetch(
                            `${supabaseUrl}/rest/v1/program_enrollments?program_id=eq.${program_id}&status=neq.dropped&select=id&count=exact&head=true`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${serviceRoleKey}`,
                                    'apikey': serviceRoleKey
                                }
                            }
                        );
                        
                        if (enrollmentCountResponse.ok) {
                            const contentRange = enrollmentCountResponse.headers.get('content-range');
                            const currentCount = parseInt(contentRange?.split('/')[1] || '0');
                            if (currentCount >= program.enrollment_capacity) {
                                throw new Error('Program enrollment capacity has been reached');
                            }
                        }
                    }
                    
                    // Check enrollment deadline
                    if (program.enrollment_deadline) {
                        const deadline = new Date(program.enrollment_deadline);
                        if (new Date() > deadline) {
                            throw new Error('Enrollment deadline has passed');
                        }
                    }
                    
                    // Create enrollment
                    const newEnrollment = {
                        program_id,
                        user_id: enrollUserId,
                        community_id: communityId,
                        status: 'active',
                        enrollment_source: enrollmentData.enrollment_source || (target_user_id ? 'admin_assigned' : 'self_enrollment'),
                        enrollment_pathway: enrollmentData.enrollment_pathway,
                        assigned_by: target_user_id ? userId : null,
                        target_completion_date: enrollmentData.target_completion_date,
                        program_settings: enrollmentData.program_settings || {},
                        enrolled_at: new Date().toISOString()
                    };
                    
                    const createResponse = await fetch(`${supabaseUrl}/rest/v1/program_enrollments`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(newEnrollment)
                    });
                    
                    if (!createResponse.ok) {
                        const errorText = await createResponse.text();
                        throw new Error(`Failed to create enrollment: ${errorText}`);
                    }
                    
                    const createdEnrollment = await createResponse.json();
                    return new Response(JSON.stringify({ data: createdEnrollment[0] }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

            case 'PUT':
                if (!enrollmentId || enrollmentId === 'program-enrollment-api') {
                    throw new Error('Enrollment ID required for update');
                }
                
                const updateData = await req.json();
                
                // Calculate progress if course completions are updated
                let progressUpdate = {};
                if (updateData.completed_courses) {
                    // Get program course sequence to calculate progress
                    const enrollmentResponse = await fetch(
                        `${supabaseUrl}/rest/v1/program_enrollments?id=eq.${enrollmentId}&select=program_id,programs(course_sequence)`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    
                    if (enrollmentResponse.ok) {
                        const enrollments = await enrollmentResponse.json();
                        if (enrollments.length > 0) {
                            const courseSequence = enrollments[0].programs.course_sequence || [];
                            const completedCourses = updateData.completed_courses || [];
                            
                            const progressPercentage = courseSequence.length > 0 
                                ? (completedCourses.length / courseSequence.length) * 100
                                : 0;
                            
                            progressUpdate = {
                                progress_percentage: Math.min(progressPercentage, 100),
                                completed_at: progressPercentage >= 100 ? new Date().toISOString() : null,
                                actual_completion_date: progressPercentage >= 100 ? new Date().toISOString().split('T')[0] : null,
                                status: progressPercentage >= 100 ? 'completed' : 'active'
                            };
                        }
                    }
                }
                
                const enrollmentUpdate = {
                    ...updateData,
                    ...progressUpdate,
                    last_activity_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/program_enrollments?id=eq.${enrollmentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(enrollmentUpdate)
                });
                
                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update enrollment: ${errorText}`);
                }
                
                const updatedEnrollment = await updateResponse.json();
                return new Response(JSON.stringify({ data: updatedEnrollment[0] }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'DELETE':
                if (!enrollmentId || enrollmentId === 'program-enrollment-api') {
                    throw new Error('Enrollment ID required for deletion');
                }
                
                // Update status to 'dropped' instead of hard delete to preserve data
                const dropResponse = await fetch(`${supabaseUrl}/rest/v1/program_enrollments?id=eq.${enrollmentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'dropped',
                        updated_at: new Date().toISOString()
                    })
                });
                
                if (!dropResponse.ok) {
                    const errorText = await dropResponse.text();
                    throw new Error(`Failed to drop enrollment: ${errorText}`);
                }
                
                return new Response(JSON.stringify({ data: { success: true, action: 'dropped' } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            default:
                throw new Error('Method not allowed');
        }

    } catch (error) {
        console.error('Program Enrollment API error:', error);

        const errorResponse = {
            error: {
                code: 'PROGRAM_ENROLLMENT_API_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});