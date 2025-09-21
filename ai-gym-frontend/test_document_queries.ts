// Test different document query approaches
import { supabase } from './src/lib/supabase'

async function testDocumentQueries() {
  console.log('Testing different document query approaches...')
  
  try {
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
    
    // Test 2: Direct query of documents table
    console.log('\n=== Test 2: Documents table ===')
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
    
    if (docError) {
      console.error('Error fetching documents:', docError)
    } else {
      console.log(`Found ${documents?.length || 0} documents in documents table`);
    }
    
    // Test 3: Original JOIN query with debug
    console.log('\n=== Test 3: JOIN query ===')
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
        console.log(`${index + 1}. ${item.title} - Documents: ${JSON.stringify(item.documents)}`);
      });
    }
    
  } catch (error) {
    console.error('Failed to run document queries:', error)
  }
}

testDocumentQueries()
