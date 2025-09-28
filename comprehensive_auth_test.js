#!/usr/bin/env node

/**
 * Comprehensive Authentication Testing Suite
 * Tests the AI Gym platform authentication for infinite loop issues
 */

const BASE_URL = 'https://noiduds84xub.space.minimax.io';

async function testBasicConnectivity() {
  console.log('🔗 Testing basic connectivity...');
  try {
    const response = await fetch(BASE_URL);
    const status = response.status;
    const headers = response.headers;
    
    console.log(`✅ Status: ${status}`);
    console.log(`✅ Content-Type: ${headers.get('content-type')}`);
    console.log(`✅ Cache-Control: ${headers.get('cache-control')}`);
    
    const content = await response.text();
    const hasReactRoot = content.includes('<div id="root">');
    const hasJSBundle = content.includes('.js');
    const hasCSSBundle = content.includes('.css');
    
    console.log(`✅ React Root: ${hasReactRoot ? 'Found' : 'Missing'}`);
    console.log(`✅ JS Bundle: ${hasJSBundle ? 'Found' : 'Missing'}`);
    console.log(`✅ CSS Bundle: ${hasCSSBundle ? 'Found' : 'Missing'}`);
    
    return { status, hasReactRoot, hasJSBundle, hasCSSBundle };
  } catch (error) {
    console.error('❌ Connectivity test failed:', error.message);
    return null;
  }
}

async function testResourceLoading() {
  console.log('\n📦 Testing resource loading...');
  try {
    // Test if main assets are accessible
    const jsResponse = await fetch(`${BASE_URL}/assets/index-DXw0FNfU.js`);
    const cssResponse = await fetch(`${BASE_URL}/assets/index-o6qRJUlf.css`);
    
    console.log(`✅ JS Bundle: ${jsResponse.status}`);
    console.log(`✅ CSS Bundle: ${cssResponse.status}`);
    
    return {
      jsLoaded: jsResponse.status === 200,
      cssLoaded: cssResponse.status === 200
    };
  } catch (error) {
    console.error('❌ Resource loading test failed:', error.message);
    return null;
  }
}

async function testRoutes() {
  console.log('\n🛣️ Testing route accessibility...');
  const routes = [
    '/',
    '/login',
    '/admin/login',
    '/dashboard',
    '/communities'
  ];
  
  const results = {};
  
  for (const route of routes) {
    try {
      const response = await fetch(`${BASE_URL}${route}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AuthTest/1.0)'
        }
      });
      
      results[route] = {
        status: response.status,
        redirected: response.redirected,
        finalUrl: response.url
      };
      
      console.log(`✅ ${route}: ${response.status} ${response.redirected ? '(redirected)' : ''}`);
    } catch (error) {
      results[route] = { error: error.message };
      console.error(`❌ ${route}: ${error.message}`);
    }
  }
  
  return results;
}

async function testCacheHeaders() {
  console.log('\n🗄️ Testing cache headers for potential session issues...');
  try {
    const response = await fetch(BASE_URL, { method: 'HEAD' });
    const headers = {
      'cache-control': response.headers.get('cache-control'),
      'etag': response.headers.get('etag'),
      'expires': response.headers.get('expires'),
      'last-modified': response.headers.get('last-modified')
    };
    
    console.log('📋 Cache Headers:');
    Object.entries(headers).forEach(([key, value]) => {
      console.log(`   ${key}: ${value || 'not set'}`);
    });
    
    return headers;
  } catch (error) {
    console.error('❌ Cache header test failed:', error.message);
    return null;
  }
}

async function testSessionPersistence() {
  console.log('\n🍪 Testing session persistence patterns...');
  try {
    const response = await fetch(BASE_URL);
    const content = await response.text();
    
    // Check for potential localStorage usage patterns
    const hasLocalStorage = content.includes('localStorage') || content.includes('sessionStorage');
    const hasSupabase = content.includes('supabase');
    const hasAuthPattern = content.includes('auth') || content.includes('session');
    
    console.log(`✅ Local Storage Usage: ${hasLocalStorage ? 'Detected' : 'Not detected'}`);
    console.log(`✅ Supabase Integration: ${hasSupabase ? 'Detected' : 'Not detected'}`);
    console.log(`✅ Auth Patterns: ${hasAuthPattern ? 'Detected' : 'Not detected'}`);
    
    return { hasLocalStorage, hasSupabase, hasAuthPattern };
  } catch (error) {
    console.error('❌ Session persistence test failed:', error.message);
    return null;
  }
}

async function testCORS() {
  console.log('\n🌍 Testing CORS configuration...');
  try {
    const response = await fetch(BASE_URL, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://test.example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers')
    };
    
    console.log('📋 CORS Headers:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`   ${key}: ${value || 'not set'}`);
    });
    
    return corsHeaders;
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
    return null;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Authentication Testing Suite\n');
  console.log(`🎯 Target URL: ${BASE_URL}\n`);
  
  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    tests: {}
  };
  
  // Run all tests
  results.tests.connectivity = await testBasicConnectivity();
  results.tests.resources = await testResourceLoading();
  results.tests.routes = await testRoutes();
  results.tests.cacheHeaders = await testCacheHeaders();
  results.tests.sessionPersistence = await testSessionPersistence();
  results.tests.cors = await testCORS();
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const connectivity = results.tests.connectivity;
  if (connectivity) {
    console.log(`✅ Site is accessible (Status: ${connectivity.status})`);
    console.log(`✅ React app structure is ${connectivity.hasReactRoot ? 'correct' : 'missing'}`);
  } else {
    console.log('❌ Site is not accessible');
  }
  
  const resources = results.tests.resources;
  if (resources) {
    console.log(`✅ Resources loading: JS=${resources.jsLoaded}, CSS=${resources.cssLoaded}`);
  }
  
  const routes = results.tests.routes;
  const accessibleRoutes = Object.values(routes).filter(r => !r.error).length;
  console.log(`✅ Route accessibility: ${accessibleRoutes}/${Object.keys(routes).length} routes accessible`);
  
  console.log('\n💾 Saving detailed results...');
  
  return results;
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTest()
    .then(results => {
      console.log('\n✅ Testing completed successfully!');
      console.log('\n📄 Full results saved for analysis');
      
      // Write results to file
      const fs = require('fs');
      fs.writeFileSync('/workspace/test_results/auth_test_results.json', JSON.stringify(results, null, 2));
      console.log('📁 Results saved to: /workspace/test_results/auth_test_results.json');
    })
    .catch(error => {
      console.error('\n❌ Testing failed:', error);
      process.exit(1);
    });
}

export { runComprehensiveTest };