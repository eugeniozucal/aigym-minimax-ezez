// Test AI agents query with authentication
import { supabase } from './src/lib/supabase'

async function testAIAgentsQuery() {
  console.log('Testing AI agents query with authentication...')
  
  try {
    // First, authenticate with demo credentials
    console.log('\n=== Authenticating with demo credentials ===')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ez@weakity.com',
      password: '123456789'
    })
    
    if (authError) {
      console.error('Authentication failed:', authError.message)
      return
    }
    
    console.log('Authentication successful!')
    
    // Test 1: Direct query of content_items with ai_agent type only
    console.log('\n=== Test 1: Content items of type ai_agent ===')
    const { data: contentItems, error: contentError } = await supabase
      .from('content_items')
      .select('*')
      .eq('content_type', 'ai_agent')
    
    if (contentError) {
      console.error('Error fetching content_items:', contentError)
    } else {
      console.log(`Found ${contentItems?.length || 0} content items with type 'ai_agent':`)
      contentItems?.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} (${item.status})`);
      });
    }
    
    // Test 2: JOIN query (same as RepositoryPopup uses)
    console.log('\n=== Test 2: JOIN query ===')
    const { data: joinedData, error: joinError } = await supabase
      .from('content_items')
      .select(`
        id,
        title,
        description,
        content_type,
        status,
        ai_agents (
          id,
          agent_name,
          short_description,
          system_prompt
        )
      `)
      .eq('content_type', 'ai_agent')
    
    if (joinError) {
      console.error('Error in JOIN query:', joinError)
    } else {
      console.log(`JOIN query returned ${joinedData?.length || 0} results:`);
      joinedData?.forEach((item, index) => {
        const agentData = Array.isArray(item.ai_agents) ? item.ai_agents[0] : item.ai_agents
        console.log(`${index + 1}. ${item.title} (${item.status}) - Agent: ${agentData ? 'Yes' : 'No'}`);
        if (agentData) {
          console.log(`   - Agent name: ${agentData.agent_name}`);
          console.log(`   - Description: ${agentData.short_description || 'No description'}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to run AI agents queries:', error)
  }
}

testAIAgentsQuery()
