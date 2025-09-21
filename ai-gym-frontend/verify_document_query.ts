// Verify that the document query works correctly
import { supabase } from './src/lib/supabase'

async function testDocumentQuery() {
  console.log('Testing document query...')
  
  try {
    // Test the exact same query used in RepositoryPopup for documents
    let query = supabase
      .from('content_items')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        content_type,
        status,
        created_by,
        created_at,
        updated_at,
        documents (
          id,
          content_html,
          content_json,
          word_count,
          reading_time_minutes
        )
      `)
      .eq('content_type', 'document')
      .order('updated_at', { ascending: false })
      .limit(50)
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching documents:', error)
      return
    }
    
    console.log(`Found ${data?.length || 0} documents:`)
    
    if (data && data.length > 0) {
      data.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} (${item.status})`);
        const documentData = Array.isArray(item.documents) ? item.documents[0] : item.documents
        if (documentData) {
          console.log(`   - Word count: ${documentData.word_count || 0}`);
          console.log(`   - Reading time: ${documentData.reading_time_minutes || 0} min`);
        }
      });
    } else {
      console.log('No documents found in the database.')
    }
    
  } catch (error) {
    console.error('Failed to run document query:', error)
  }
}

testDocumentQuery()
