import { createClient } from '@supabase/supabase-js';

// Test community associations with authenticated user context
const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthenticatedQuery() {
  console.log('\n🔐 Testing community associations with authenticated context...');
  
  try {
    // Login as admin user
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'dlocal@aiworkify.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.log(`❌ Login failed: ${loginError.message}`);
      return;
    }
    
    console.log(`✅ Logged in as: ${loginData.user.email}`);
    
    // Test the exact query from Users.tsx component with auth context
    const { data: usersWithCommunities, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        created_at,
        user_communities (
          community_id,
          role,
          joined_at,
          communities (
            id,
            name,
            brand_color,
            logo_url
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log(`❌ Users query failed: ${error.message}`);
      return;
    }
    
    console.log(`✅ Users query successful! Found ${usersWithCommunities.length} users`);
    
    // Check community associations
    const testUserEmails = ['dlocal@aiworkify.com', 'tatozucal@gmail.com', 'eugenio.zucal@gmail.com'];
    const foundTestUsers = usersWithCommunities.filter(user => 
      testUserEmails.includes(user.email)
    );
    
    console.log(`\n📊 Authenticated Test Results:`);
    foundTestUsers.forEach(user => {
      console.log(`   • ${user.first_name} ${user.last_name} (${user.email})`);
      if (user.user_communities && user.user_communities.length > 0) {
        user.user_communities.forEach(uc => {
          const community = Array.isArray(uc.communities) ? uc.communities[0] : uc.communities;
          console.log(`     - Community: ${community?.name || 'Unknown'} (Role: ${uc.role})`);
          console.log(`     - Brand Color: ${community?.brand_color || 'N/A'}`);
        });
      } else {
        console.log('     - No communities found');
      }
    });
    
    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    return foundTestUsers.length;
    
  } catch (error) {
    console.log(`❌ Unexpected error: ${error}`);
    return 0;
  }
}

// Run the authenticated test
testAuthenticatedQuery().then(count => {
  console.log(`\n🏁 Final Result: Found ${count}/3 users with proper authentication context`);
}).catch(console.error);
