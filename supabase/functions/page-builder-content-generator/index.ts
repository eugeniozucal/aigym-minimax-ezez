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
        const { blockType, promptText, contentContext, targetAudience = 'general' } = await req.json();

        if (!blockType || !promptText) {
            throw new Error('Block type and prompt text are required');
        }

        // Get environment variables
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }

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

        // Create block-specific prompts
        const blockPrompts = {
            'rich_text': `Create engaging, well-formatted HTML content for a rich text block. 
                Target audience: ${targetAudience}
                Context: ${contentContext || 'General educational content'}
                User request: ${promptText}
                
                Please provide:
                1. Clean HTML content with proper formatting
                2. Use semantic HTML tags (h1-h6, p, ul, ol, blockquote, etc.)
                3. Include relevant links where appropriate
                4. Make it engaging and educational
                
                Return only the HTML content, no additional text or explanations.`,
            
            'section_header': `Create a compelling section header for educational content.
                Target audience: ${targetAudience}
                Context: ${contentContext || 'Educational section'}
                User request: ${promptText}
                
                Please provide:
                1. A clear, engaging title (max 60 characters)
                2. An optional subtitle that adds context (max 120 characters)
                3. Choose appropriate header level (1-6)
                
                Return in JSON format: {"title": "...", "subtitle": "...", "level": 2}`,
            
            'list': `Create a comprehensive list for educational content.
                Target audience: ${targetAudience}
                Context: ${contentContext || 'Educational list'}
                User request: ${promptText}
                
                Please provide:
                1. Choose between 'ordered' or 'unordered' list type
                2. Create 3-10 relevant list items
                3. Each item should be clear and actionable
                
                Return in JSON format: {"type": "unordered|ordered", "items": [{"id": "1", "text": "...", "html": "..."}]}`,
            
            'quote': `Create an inspirational or educational quote.
                Target audience: ${targetAudience}
                Context: ${contentContext || 'Educational content'}
                User request: ${promptText}
                
                Please provide:
                1. A meaningful quote (can be existing or created)
                2. Author name (if applicable)
                3. Source (if applicable)
                
                Return in JSON format: {"text": "...", "author": "...", "source": "..."}`,
            
            'accordion': `Create accordion content with multiple expandable sections.
                Target audience: ${targetAudience}
                Context: ${contentContext || 'Educational FAQ or structured content'}
                User request: ${promptText}
                
                Please provide:
                1. 3-6 accordion items
                2. Clear, descriptive titles
                3. Detailed content for each section
                4. Mark one section as open by default
                
                Return in JSON format: {"items": [{"id": "1", "title": "...", "content": "...", "html": "...", "is_open_by_default": false}], "allow_multiple_open": true}`,
            
            'quiz': `Create an educational quiz with multiple questions.
                Target audience: ${targetAudience}
                Context: ${contentContext || 'Educational assessment'}
                User request: ${promptText}
                
                Please provide:
                1. Quiz title and description
                2. 3-5 relevant questions
                3. Mix of question types (multiple choice, true/false)
                4. Correct answers and explanations
                
                Return in JSON format with quiz structure including title, description, and questions array.`
        };

        const prompt = blockPrompts[blockType] || `Generate content for ${blockType} block: ${promptText}`;

        // Call Gemini API
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API error: ${errorText}`);
        }

        const geminiData = await geminiResponse.json();
        const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error('No content generated from Gemini API');
        }

        // Process the generated content based on block type
        let processedContent;
        
        try {
            // Try to parse as JSON for structured blocks
            if (['section_header', 'list', 'quote', 'accordion', 'quiz'].includes(blockType)) {
                // Clean up the response (remove markdown code blocks if present)
                const cleanedText = generatedText.replace(/```json\n?|```\n?/g, '').trim();
                processedContent = JSON.parse(cleanedText);
            } else {
                // For rich_text and other blocks, use as-is
                processedContent = {
                    html: generatedText.trim(),
                    text: generatedText.replace(/<[^>]*>/g, '').trim()
                };
            }
        } catch (parseError) {
            console.warn('Failed to parse generated content as JSON, using as text:', parseError);
            processedContent = {
                html: generatedText.trim(),
                text: generatedText.replace(/<[^>]*>/g, '').trim()
            };
        }

        return new Response(JSON.stringify({
            data: {
                blockType,
                generatedContent: processedContent,
                rawContent: generatedText,
                prompt: promptText,
                context: contentContext,
                targetAudience
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Content generation error:', error);

        const errorResponse = {
            error: {
                code: 'CONTENT_GENERATION_FAILED',
                message: error.message || 'Failed to generate content'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});