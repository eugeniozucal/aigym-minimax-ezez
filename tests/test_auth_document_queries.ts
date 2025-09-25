// Test document queries with authentication
import { supabase } from './src/lib/supabase'

async function testDocumentQueriesWithAuth() {
  console.log('Testing document queries with authentication...')
  
  try {
    // First, try to sign in with the demo credentials
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
    
    // Test 1: Direct query of content_items with document type only
    console.log('\n=== Test 1: Content items of type document ===')
    const { data: contentItems, error: contentError } = await supabase
      .from('content_items')
      .select('*')
      .eq('content_type', 'document')
    
    if (contentError) {
      console.error('Error fetching content_items:', contentError)
    } else {
      console.log(`Found ${contentItems?.length || 0} content items with type 'document':`)
      contentItems?.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} (${item.status})`);
      });
    }
    
    // Test 2: JOIN query
    console.log('\n=== Test 2: JOIN query ===')
    const { data: joinedData, error: joinError } = await supabase
      .from('content_items')
      .select(`
        id,
        title,
        description,
        content_type,
        status,
        documents (
          id,
          content_html,
          word_count,
          reading_time_minutes
        )
      `)
      .eq('content_type', 'document')
    
    if (joinError) {
      console.error('Error in JOIN query:', joinError)
    } else {
      console.log(`JOIN query returned ${joinedData?.length || 0} results:`);
      joinedData?.forEach((item, index) => {
        const docData = Array.isArray(item.documents) ? item.documents[0] : item.documents
        console.log(`${index + 1}. ${item.title} (${item.status}) - Document: ${docData ? 'Yes' : 'No'}`);
        if (docData) {
          console.log(`   - Word count: ${docData.word_count}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to run document queries:', error)
  }
}

testDocumentQueriesWithAuth()
