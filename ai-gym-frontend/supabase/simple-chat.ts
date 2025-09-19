// Simple working Gemini chatbot edge function
// This should work immediately with just API key and prompt

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { message, systemPrompt } = await req.json()
    
    // Get Gemini API key
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      console.error('No Gemini API key found')
      return new Response(
        JSON.stringify({ error: 'API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Sending request to Gemini API...')
    console.log('Message:', message)
    console.log('System prompt length:', systemPrompt?.length || 0)

    // Call Gemini API with correct model name
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    
    const prompt = systemPrompt ? `${systemPrompt}\n\nUser: ${message}` : message

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    })

    console.log('Gemini API response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response', details: error }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    console.log('Gemini API success!')

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'

    return new Response(
      JSON.stringify({ response: aiResponse }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})