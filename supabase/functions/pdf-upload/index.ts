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
        const { fileData, fileName } = await req.json();

        if (!fileData || !fileName) {
            throw new Error('PDF data and filename are required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Validate user authentication
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authorization header required');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify user token
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid authentication token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Extract base64 data from data URL
        const base64Data = fileData.split(',')[1];
        const mimeType = fileData.split(';')[0].split(':')[1];

        // Validate mime type
        if (mimeType !== 'application/pdf') {
            throw new Error(`Only PDF files are supported. Received: ${mimeType}`);
        }

        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Check file size (50MB limit)
        if (binaryData.length > 52428800) {
            throw new Error('PDF size exceeds 50MB limit');
        }

        // Create unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = fileName.split('.').pop();
        const uniqueFileName = `${timestamp}-${fileName}`;
        const filePath = `pdfs/${uniqueFileName}`;

        // Upload to Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/content-pdfs/${filePath}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': mimeType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${errorText}`);
        }

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/content-pdfs/${filePath}`;

        // Basic PDF page count estimation (simplified)
        // In a real application, you would use a PDF library to get accurate page count
        let pageCount = 1; // Default to 1 page
        
        // Simple heuristic: estimate pages based on file size
        // Average PDF page is around 50KB, but this varies greatly
        const estimatedPages = Math.ceil(binaryData.length / 51200); // 50KB per page estimate
        pageCount = Math.max(1, Math.min(estimatedPages, 1000)); // Cap at 1000 pages

        // Generate thumbnail URL (placeholder for now)
        // In production, you'd use a service to generate PDF thumbnails
        const thumbnailUrl = `/api/pdf-thumbnail/${uniqueFileName}?page=1`;

        const result = {
            data: {
                pdfUrl: publicUrl,
                fileName: uniqueFileName,
                filePath: filePath,
                fileSize: binaryData.length,
                pageCount: pageCount,
                thumbnailUrl: thumbnailUrl
            }
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('PDF upload error:', error);

        const errorResponse = {
            error: {
                code: 'PDF_UPLOAD_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});