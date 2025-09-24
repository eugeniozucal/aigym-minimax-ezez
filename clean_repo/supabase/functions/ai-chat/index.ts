import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  systemPrompt: string
  agentId?: string
  conversationId?: string
  userId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { messages, systemPrompt, agentId, conversationId, userId }: ChatRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    let supabase = null
    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey)
    }

    // Get AI API key from environment - prioritize Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')

    let aiResponse: string
    let modelUsed: string

    if (geminiApiKey) {
      // Use Google Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`
      
      // Convert messages to Gemini format
      const geminiMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }]
      }))

      // Add system prompt as first message if provided
      const contents = systemPrompt 
        ? [{ role: 'user', parts: [{ text: systemPrompt }] }, { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] }, ...geminiMessages]
        : geminiMessages

      const geminiPayload = {
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topK: 40,
          topP: 0.95
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiPayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API Error:', response.status, errorText)
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        aiResponse = data.candidates[0].content.parts[0].text
        modelUsed = 'gemini-1.5-flash'
      } else {
        throw new Error('Invalid response format from Gemini API')
      }

    } else if (openaiApiKey) {
      // Use OpenAI API
      const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ]

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      aiResponse = data.choices[0].message.content
      modelUsed = 'gpt-4o-mini'

    } else if (anthropicApiKey) {
      // Use Anthropic Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anthropicApiKey}`,
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages.filter(m => m.role !== 'system')
        }),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`)
      }

      const data = await response.json()
      aiResponse = data.content[0].text
      modelUsed = 'claude-3-haiku'

    } else {
      // Fallback: Enhanced simulation with system prompt analysis
      aiResponse = generateSimulatedResponse(systemPrompt, messages)
      modelUsed = 'simulation'
    }

    // Save conversation and messages to database if possible
    let currentConversationId = conversationId
    if (supabase && agentId && userId) {
      try {
        // Create or get conversation
        if (!currentConversationId) {
          const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              agent_id: agentId,
              user_id: userId,
              title: messages.length > 0 ? messages[0].content.substring(0, 50) + '...' : 'New Conversation'
            })
            .select('id')
            .single()
          
          if (!convError && conversation) {
            currentConversationId = conversation.id
          }
        }

        // Save user message
        if (currentConversationId && messages.length > 0) {
          const lastUserMessage = messages.filter(m => m.role === 'user').pop()
          if (lastUserMessage) {
            await supabase
              .from('conversation_messages')
              .insert({
                conversation_id: currentConversationId,
                role: 'user',
                content: lastUserMessage.content
              })
          }
        }

        // Save AI response
        if (currentConversationId) {
          await supabase
            .from('conversation_messages')
            .insert({
              conversation_id: currentConversationId,
              role: 'assistant',
              content: aiResponse,
              model_used: modelUsed
            })
        }
      } catch (dbError) {
        console.warn('Failed to save conversation:', dbError)
        // Don't fail the request if DB save fails
      }
    }

    return new Response(JSON.stringify({ 
      message: aiResponse,
      model: modelUsed,
      timestamp: new Date().toISOString(),
      conversationId: currentConversationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('AI Chat Error:', error)
    
    // Determine error type and provide appropriate response
    let errorCode = 'AI_CHAT_ERROR'
    let errorMessage = 'Failed to generate AI response'
    let statusCode = 500
    
    if (error.message?.includes('Gemini API error')) {
      errorCode = 'GEMINI_API_ERROR'
      errorMessage = 'AI service temporarily unavailable. Please try again.'
      statusCode = 503
    } else if (error.message?.includes('OpenAI API error')) {
      errorCode = 'OPENAI_API_ERROR'
      errorMessage = 'AI service temporarily unavailable. Please try again.'
      statusCode = 503
    } else if (error.message?.includes('Anthropic API error')) {
      errorCode = 'ANTHROPIC_API_ERROR'
      errorMessage = 'AI service temporarily unavailable. Please try again.'
      statusCode = 503
    } else if (error.message?.includes('Invalid response format')) {
      errorCode = 'RESPONSE_FORMAT_ERROR'
      errorMessage = 'AI service returned an invalid response. Please try again.'
      statusCode = 502
    } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      errorCode = 'NETWORK_ERROR'
      errorMessage = 'Network connection issue. Please check your internet connection.'
      statusCode = 503
    }
    
    return new Response(JSON.stringify({
      error: {
        code: errorCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        userFriendly: true
      }
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateSimulatedResponse(systemPrompt: string, messages: ChatMessage[]): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
  
  // Analyze system prompt for key characteristics
  const isCustomerSupport = systemPrompt.toLowerCase().includes('customer') || systemPrompt.toLowerCase().includes('support')
  const isCreative = systemPrompt.toLowerCase().includes('creative') || systemPrompt.toLowerCase().includes('write')
  const isTechnical = systemPrompt.toLowerCase().includes('technical') || systemPrompt.toLowerCase().includes('code')
  const isAnalytical = systemPrompt.toLowerCase().includes('analy') || systemPrompt.toLowerCase().includes('research')
  
  // Generate contextual responses based on system prompt
  if (isCustomerSupport) {
    return `Thank you for reaching out! Based on your question about "${lastUserMessage.substring(0, 50)}...", I'm here to help. As defined in my system prompt, I focus on providing helpful customer support. Let me address your concern step by step.\n\n[This is a simulated response - in production, this would be powered by ${systemPrompt.includes('helpful') ? 'a helpful AI assistant' : 'a specialized customer service AI'} using the defined system prompt]`
  }
  
  if (isCreative) {
    return `What an interesting creative challenge! You've asked about "${lastUserMessage.substring(0, 50)}..." and I can see from my system prompt that I should approach this with creativity and imagination. Let me craft a response that aligns with the creative guidelines you've set.\n\n[This is a simulated creative response - in production, this would be generated by an AI with the creative parameters and personality defined in your system prompt]`
  }
  
  if (isTechnical) {
    return `I understand you're asking about "${lastUserMessage.substring(0, 50)}..." from a technical perspective. Based on my system prompt configuration, I should provide detailed, technical guidance. Let me break this down systematically.\n\n[This is a simulated technical response - in production, this would be generated by an AI following the technical expertise and communication style defined in your system prompt]`
  }
  
  if (isAnalytical) {
    return `Thank you for your analytical question about "${lastUserMessage.substring(0, 50)}...". My system prompt indicates I should provide thorough analysis and research-based insights. Let me examine this systematically.\n\n[This is a simulated analytical response - in production, this would be generated by an AI following the analytical framework and methodology defined in your system prompt]`
  }
  
  // Default response
  return `I understand you're asking about "${lastUserMessage.substring(0, 50)}...". Based on the system prompt you've defined ("${systemPrompt.substring(0, 100)}..."), I should respond according to those specific instructions and personality traits.\n\n[This is a simulated response - in production, this would be generated by a real AI model following your exact system prompt. The AI would maintain the personality, knowledge scope, and response style you've defined.]`
}