const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test direct block creation
async function testBlockCreation() {
  try {
    console.log('Testing block creation...')
    
    // First, get a page ID to test with
    const { data: pages, error: pageError } = await supabase
      .from('pages')
      .select('id')
      .limit(1)
    
    if (pageError) {
      console.error('Error getting page:', pageError)
      return
    }
    
    if (!pages || pages.length === 0) {
      console.error('No pages found')
      return
    }
    
    const pageId = pages[0].id
    console.log('Using page ID:', pageId)
    
    // Test block creation with same structure as BLOCK_DEFINITIONS
    const testBlock = {
      page_id: pageId,
      block_type: 'section_header',
      order_index: 999, // High number to avoid conflicts
      config: {},
      style: { marginBottom: '1rem' },
      content: { level: 2, title: 'Test Section Title' },
      visibility_conditions: {},
      is_visible: true,
      created_by: 'test-user-id'
    }
    
    console.log('Creating block with data:', JSON.stringify(testBlock, null, 2))
    
    const { data, error } = await supabase
      .from('blocks')
      .insert(testBlock)
      .select()
      .single()
    
    if (error) {
      console.error('Block creation failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('Block created successfully:', data)
      
      // Clean up - delete the test block
      const { error: deleteError } = await supabase
        .from('blocks')
        .delete()
        .eq('id', data.id)
        
      if (deleteError) {
        console.error('Failed to clean up test block:', deleteError)
      } else {
        console.log('Test block cleaned up successfully')
      }
    }
    
  } catch (error) {
    console.error('Test failed with error:', error)
  }
}

testBlockCreation()