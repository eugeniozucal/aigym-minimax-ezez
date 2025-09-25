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
        const url = new URL(req.url);
        const method = req.method;
        const pathParts = url.pathname.split('/').filter(Boolean);
        const programId = pathParts[pathParts.length - 1];
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        let userId = null;
        
        // For public GET requests (listing programs), allow unauthenticated access
        if (method === 'GET' && authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                }
            } catch (error) {
                console.log('Failed to decode user, continuing with public access');
            }
        } else if (method !== 'GET') {
            // For POST/PUT/DELETE operations, require authentication
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
            userId = userData.id;
        }

        // Get current client (for multi-tenancy)
        const clientId = req.headers.get('x-client-id') || null;

        switch (method) {
            case 'GET':
                if (programId && programId !== 'programs-api') {
                    // Get specific program with detailed information
                    const selectFields = `
                        *,
                        program_course_assignments(
                            *,
                            courses(
                                id,
                                title,
                                description,
                                thumbnail_url,
                                difficulty_level,
                                estimated_duration_minutes,
                                status
                            )
                        ),
                        program_enrollments(
                            id,
                            user_id,
                            status,
                            progress_percentage,
                            enrolled_at,
                            completed_at
                        )
                    `;
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${programId}&select=${selectFields}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch program');
                    }
                    
                    const programs = await response.json();
                    if (programs.length === 0) {
                        throw new Error('Program not found');
                    }
                    
                    const program = programs[0];
                    
                    // Calculate enrollment statistics
                    const enrollmentStats = {
                        totalEnrollments: program.program_enrollments.length,
                        activeEnrollments: program.program_enrollments.filter(e => e.status === 'active').length,
                        completedEnrollments: program.program_enrollments.filter(e => e.status === 'completed').length,
                        averageProgress: program.program_enrollments.length > 0 
                            ? program.program_enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / program.program_enrollments.length
                            : 0
                    };
                    
                    // Sort courses by order_index
                    program.program_course_assignments.sort((a, b) => a.order_index - b.order_index);
                    
                    return new Response(JSON.stringify({ 
                        data: {
                            ...program,
                            enrollmentStats
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                } else {
                    // List programs with filtering and pagination
                    const searchParams = new URLSearchParams(url.search);
                    const status = searchParams.get('status');
                    const programType = searchParams.get('type');
                    const difficulty = searchParams.get('difficulty');
                    const category = searchParams.get('category');
                    const search = searchParams.get('search');
                    const limit = parseInt(searchParams.get('limit') || '50');
                    const offset = parseInt(searchParams.get('offset') || '0');
                    const includeStats = searchParams.get('include_stats') === 'true';
                    
                    let query = `select=*${includeStats ? ',program_enrollments(count)' : ''}&limit=${limit}&offset=${offset}&order=updated_at.desc`;
                    
                    // Add filters
                    const filters = [];
                    if (status && status !== 'all') {
                        filters.push(`status=eq.${status}`);
                    }
                    if (programType && programType !== 'all') {
                        filters.push(`program_type=eq.${programType}`);
                    }
                    if (difficulty && difficulty !== 'all') {
                        filters.push(`difficulty_level=eq.${difficulty}`);
                    }
                    if (category && category !== 'all') {
                        filters.push(`category=eq.${category}`);
                    }
                    if (clientId) {
                        filters.push(`client_id=eq.${clientId}`);
                    }
                    
                    if (filters.length > 0) {
                        query += `&${filters.join('&')}`;
                    }
                    
                    // Add search filter if provided
                    if (search) {
                        query += `&or=(title.ilike.%${search}%,description.ilike.%${search}%)`;
                    }
                    
                    const response = await fetch(`${supabaseUrl}/rest/v1/programs?${query}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch programs');
                    }
                    
                    const programs = await response.json();
                    
                    // Get total count for pagination
                    let totalCount = null;
                    if (searchParams.get('count') === 'true') {
                        const countQuery = query.replace(/select=[^&]*/, 'select=*').replace(/limit=\d+/, '').replace(/offset=\d+/, '') + '&count=exact&head=true';
                        const countResponse = await fetch(`${supabaseUrl}/rest/v1/programs?${countQuery}`, {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        });
                        
                        if (countResponse.ok) {
                            const contentRange = countResponse.headers.get('content-range');
                            if (contentRange) {
                                totalCount = parseInt(contentRange.split('/')[1] || '0');
                            }
                        }
                    }
                    
                    return new Response(JSON.stringify({ 
                        data: programs,
                        pagination: {
                            limit,
                            offset,
                            total: totalCount
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

            case 'POST':
                if (!userId) {
                    throw new Error('Authentication required for creating programs');
                }
                
                const createData = await req.json();
                const newProgram = {
                    ...createData,
                    created_by: userId,
                    client_id: clientId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/programs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(newProgram)
                });
                
                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to create program: ${errorText}`);
                }
                
                const createdProgram = await createResponse.json();
                
                // If course sequence is provided, create course assignments
                if (createData.courses && createData.courses.length > 0) {
                    const courseAssignments = createData.courses.map((course, index) => ({
                        program_id: createdProgram[0].id,
                        course_id: course.id || course.course_id,
                        order_index: index,
                        is_required: course.is_required !== false,
                        assigned_by: userId,
                        completion_criteria: course.completion_criteria || {},
                        minimum_score: course.minimum_score || null
                    }));
                    
                    await fetch(`${supabaseUrl}/rest/v1/program_course_assignments`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(courseAssignments)
                    });
                }
                
                return new Response(JSON.stringify({ data: createdProgram[0] }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'PUT':
                if (!programId || programId === 'programs-api') {
                    throw new Error('Program ID required for update');
                }
                
                if (!userId) {
                    throw new Error('Authentication required for updating programs');
                }
                
                const updateData = await req.json();
                const programUpdate = {
                    ...updateData,
                    updated_at: new Date().toISOString()
                };
                
                // Remove courses field if present (handled separately)
                delete programUpdate.courses;
                
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${programId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(programUpdate)
                });
                
                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update program: ${errorText}`);
                }
                
                const updatedProgram = await updateResponse.json();
                
                // Handle course assignments update if provided
                if (updateData.courses) {
                    // Delete existing assignments
                    await fetch(`${supabaseUrl}/rest/v1/program_course_assignments?program_id=eq.${programId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });
                    
                    // Create new assignments
                    if (updateData.courses.length > 0) {
                        const courseAssignments = updateData.courses.map((course, index) => ({
                            program_id: programId,
                            course_id: course.id || course.course_id,
                            order_index: index,
                            is_required: course.is_required !== false,
                            assigned_by: userId,
                            completion_criteria: course.completion_criteria || {},
                            minimum_score: course.minimum_score || null
                        }));
                        
                        await fetch(`${supabaseUrl}/rest/v1/program_course_assignments`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(courseAssignments)
                        });
                    }
                }
                
                return new Response(JSON.stringify({ data: updatedProgram[0] }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            case 'DELETE':
                if (!programId || programId === 'programs-api') {
                    throw new Error('Program ID required for deletion');
                }
                
                if (!userId) {
                    throw new Error('Authentication required for deleting programs');
                }
                
                const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${programId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!deleteResponse.ok) {
                    const errorText = await deleteResponse.text();
                    throw new Error(`Failed to delete program: ${errorText}`);
                }
                
                return new Response(JSON.stringify({ data: { success: true } }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            default:
                throw new Error('Method not allowed');
        }

    } catch (error) {
        console.error('Programs API error:', error);

        const errorResponse = {
            error: {
                code: 'PROGRAMS_API_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});