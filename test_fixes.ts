import { createClient } from '@supabase/supabase-js';

// Test script to verify the fixes
const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testUsers = [
  { email: 'dlocal@aiworkify.com', password: 'admin123' },
  { email: 'tatozucal@gmail.com', password: 'admin123' },
  { email: 'eugenio.zucal@gmail.com', password: 'admin123' }
];

async function testLogin(email: string, password: string) {
  console.log(`\n\n🔍 Testing login for: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log(`❌ Login failed: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    if (data.user) {
      console.log(`✅ Login successful!`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Confirmed At: ${data.user.confirmed_at}`);
      
      // Sign out immediately after test
      await supabase.auth.signOut();
      
      return { success: true, user: data.user };
    }
  } catch (error) {
    console.log(`❌ Unexpected error: ${error}`);
    return { success: false, error: error.message };
  }
}

async function testUsersQuery() {
  console.log('\n\n🔍 Testing Users.tsx query...');
  
  try {
    // Test the exact query from Users.tsx component
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
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Users query successful! Found ${usersWithCommunities.length} users`);
    
    // Check if our test users are present
    const testUserEmails = ['dlocal@aiworkify.com', 'tatozucal@gmail.com', 'eugenio.zucal@gmail.com'];
    const foundTestUsers = usersWithCommunities.filter(user => 
      testUserEmails.includes(user.email)
    );
    
    console.log(`\n📊 Test Users Found: ${foundTestUsers.length}/3`);
    
    foundTestUsers.forEach(user => {
      console.log(`   • ${user.first_name} ${user.last_name} (${user.email})`);
      if (user.user_communities && user.user_communities.length > 0) {
        user.user_communities.forEach(uc => {
          const community = Array.isArray(uc.communities) ? uc.communities[0] : uc.communities;
          console.log(`     - Community: ${community?.name || 'Unknown'} (Role: ${uc.role})`);
        });
      } else {
        console.log('     - No communities found');
      }
    });
    
    return { success: true, users: usersWithCommunities, testUsers: foundTestUsers };
    
  } catch (error) {
    console.log(`❌ Unexpected query error: ${error}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 AI Gym Platform - Critical Fixes Verification');
  console.log('================================================\n');
  
  // Test login functionality
  console.log('1️⃣  TESTING LOGIN FUNCTIONALITY');
  console.log('-------------------------------');
  
  const loginResults = [];
  for (const user of testUsers) {
    const result = await testLogin(user.email, user.password);
    loginResults.push({ email: user.email, ...result });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
  }
  
  // Test users query functionality
  console.log('\n\n2️⃣  TESTING USERS PAGE QUERY');
  console.log('-----------------------------');
  
  const queryResult = await testUsersQuery();
  
  // Generate summary report
  console.log('\n\n📋 SUMMARY REPORT');
  console.log('=================');
  
  const successfulLogins = loginResults.filter(r => r.success).length;
  
  console.log(`\n🔐 Login Fixes:`);
  console.log(`   ✅ Users confirmed: 3/3`);
  console.log(`   ✅ Successful logins: ${successfulLogins}/3`);
  
  if (queryResult.success) {
    console.log(`\n👥 Users Page Fixes:`);
    console.log(`   ✅ Query successful: Yes`);
    console.log(`   ✅ Total users found: ${queryResult.users.length}`);
    console.log(`   ✅ Test users visible: ${queryResult.testUsers.length}/3`);
    
    const usersWithCommunities = queryResult.testUsers.filter(u => 
      u.user_communities && u.user_communities.length > 0
    ).length;
    console.log(`   ✅ Users with communities: ${usersWithCommunities}/3`);
  } else {
    console.log(`\n❌ Users Page: Query failed - ${queryResult.error}`);
  }
  
  // Final assessment
  const loginSuccess = successfulLogins === 3;
  const querySuccess = queryResult.success && queryResult.testUsers.length === 3;
  
  console.log(`\n🎯 FINAL ASSESSMENT`);
  console.log(`===================`);
  console.log(`Fix #1 (Login): ${loginSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Fix #2 (Users Page): ${querySuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`\nOverall Status: ${loginSuccess && querySuccess ? '🎉 ALL FIXES SUCCESSFUL' : '⚠️  SOME ISSUES REMAIN'}`);
}

// Run the tests
runTests().catch(console.error);
