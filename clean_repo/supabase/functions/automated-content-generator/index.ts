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
        const { blockId, userId, contentType, parameters, userContext } = await req.json();

        if (!blockId || !contentType) {
            throw new Error('blockId and contentType are required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        if (!geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }

        console.log(`Generating automated content for block ${blockId}, type: ${contentType}`);

        let generatedContent = {};
        let prompt = '';
        
        // Build AI prompt based on content type and user context
        switch (contentType) {
            case 'personalized_summary':
                prompt = `Create a personalized learning summary based on the following context:
                User Context: ${JSON.stringify(userContext || {})}
                Parameters: ${JSON.stringify(parameters || {})}
                
                Generate a comprehensive yet concise summary that adapts to the user's learning style and progress. 
                Include key takeaways, actionable insights, and next steps. 
                Format the response as structured JSON with sections: title, summary, keyPoints (array), nextSteps (array), and personalizedTips (array).`;
                break;
                
            case 'adaptive_quiz':
                prompt = `Generate an adaptive quiz based on the following parameters:
                User Context: ${JSON.stringify(userContext || {})}
                Parameters: ${JSON.stringify(parameters || {})}
                
                Create quiz questions that adapt to the user's knowledge level and learning progress.
                Include multiple choice, true/false, and short answer questions.
                Format as JSON with: title, description, questions array (each with question, type, options, correctAnswer, explanation, difficulty).`;
                break;
                
            case 'dynamic_content':
                prompt = `Generate dynamic learning content based on:
                User Context: ${JSON.stringify(userContext || {})}
                Parameters: ${JSON.stringify(parameters || {})}
                
                Create engaging, contextually relevant content that adapts to user preferences and learning objectives.
                Format as JSON with: title, content (HTML), mediaRecommendations (array), interactiveElements (array).`;
                break;
                
            case 'progress_insights':
                prompt = `Generate personalized progress insights based on:
                User Context: ${JSON.stringify(userContext || {})}
                Parameters: ${JSON.stringify(parameters || {})}
                
                Analyze user progress and provide meaningful insights, achievements, areas for improvement, and motivational content.
                Format as JSON with: progressSummary, achievements (array), areasForImprovement (array), recommendations (array), motivationalMessage.`;
                break;
                
            default:
                throw new Error(`Unsupported content type: ${contentType}`);
        }

        // Call Gemini API for content generation
        console.log('Calling Gemini API for content generation...');
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
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

        const geminiResult = await geminiResponse.json();
        console.log('Gemini API response received');

        if (!geminiResult.candidates || geminiResult.candidates.length === 0) {
            throw new Error('No content generated by AI');
        }

        const generatedText = geminiResult.candidates[0].content.parts[0].text;
        
        // Parse JSON response from AI
        try {
            // Clean up the response to extract JSON
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                generatedContent = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: create structured content from text
                generatedContent = {
                    title: `Generated ${contentType}`,
                    content: generatedText,
                    generatedAt: new Date().toISOString(),
                    contentType
                };
            }
        } catch (parseError) {
            console.warn('Failed to parse AI response as JSON, using text format:', parseError.message);
            generatedContent = {
                title: `Generated ${contentType}`,
                content: generatedText,
                generatedAt: new Date().toISOString(),
                contentType
            };
        }

        // Update the block with generated content
        const updateData = {
            content: {
                ...generatedContent,
                lastGenerated: new Date().toISOString(),
                userId: userId || null,
                parameters: parameters || {},
                userContext: userContext || {}
            }
        };

        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/blocks?id=eq.${blockId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update block: ${errorText}`);
        }

        const updatedBlock = await updateResponse.json();
        console.log(`Block ${blockId} updated with generated content`);

        return new Response(JSON.stringify({
            data: {
                blockId,
                contentType,
                generatedContent,
                updatedBlock: updatedBlock[0]
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Automated content generation error:', error);

        const errorResponse = {
            error: {
                code: 'CONTENT_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});