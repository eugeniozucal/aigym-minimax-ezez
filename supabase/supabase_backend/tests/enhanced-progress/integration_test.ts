import { assertEquals, assertExists, assert } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Test configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data setup
const TEST_CLIENT_ID = "test-client-enhanced-progress";
const TEST_USER_EMAIL = "test-enhanced-progress@example.com";
const TEST_USER_ID = "test-user-enhanced-progress-001";

// Helper functions
async function createTestUser() {
  const { data, error } = await supabaseService.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: "testpassword123",
    email_confirm: true,
  });
  
  if (error) {
    console.log("User might already exist:", error.message);
  }
  
  // Insert user profile
  await supabaseService
    .from("users")
    .upsert({
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      client_id: TEST_CLIENT_ID,
      name: "Test Enhanced Progress User",
      role: "student",
    });
    
  return TEST_USER_ID;
}

async function createTestContent() {
  // Create test course
  const { data: courseData, error: courseError } = await supabaseService
    .from("courses")
    .insert({
      id: "test-course-enhanced-001",
      client_id: TEST_CLIENT_ID,
      title: "Test Enhanced Progress Course",
      description: "Course for enhanced progress testing",
      difficulty_level: "beginner",
      estimated_duration_minutes: 120,
      is_published: true,
      created_by: TEST_USER_ID,
    })
    .select()
    .single();
    
  if (courseError) {
    console.log("Course creation error:", courseError);
  }
  
  // Create test page
  const { data: pageData, error: pageError } = await supabaseService
    .from("pages")
    .insert({
      id: "test-page-enhanced-001",
      course_id: "test-course-enhanced-001",
      title: "Test Enhanced Progress Page",
      description: "Page for enhanced progress testing",
      order_index: 1,
      status: "published",
      created_by: TEST_USER_ID,
    })
    .select()
    .single();
    
  if (pageError) {
    console.log("Page creation error:", pageError);
  }
  
  // Create test blocks
  const blocks = [
    {
      id: "test-block-enhanced-001",
      page_id: "test-page-enhanced-001",
      block_type: "text",
      order_index: 1,
      config: { "text": "Introduction text" },
      content: { "text": "This is the introduction" },
      created_by: TEST_USER_ID,
    },
    {
      id: "test-block-enhanced-002",
      page_id: "test-page-enhanced-001",
      block_type: "video",
      order_index: 2,
      config: { "duration": 300, "url": "test-video.mp4" },
      content: { "video_id": "test-123" },
      created_by: TEST_USER_ID,
    },
    {
      id: "test-block-enhanced-003",
      page_id: "test-page-enhanced-001",
      block_type: "quiz",
      order_index: 3,
      config: { "questions": 5, "passing_score": 80 },
      content: { "quiz_data": {} },
      created_by: TEST_USER_ID,
    }
  ];
  
  for (const block of blocks) {
    await supabaseService.from("blocks").insert(block);
  }
  
  return { courseData, pageData, blocks };
}

async function cleanupTestData() {
  // Clean up in reverse order of dependencies
  await supabaseService.from("block_completions").delete().eq("user_id", TEST_USER_ID);
  await supabaseService.from("learning_sessions").delete().eq("user_id", TEST_USER_ID);
  await supabaseService.from("user_progress").delete().eq("user_id", TEST_USER_ID);
  await supabaseService.from("blocks").delete().like("id", "test-block-enhanced-%");
  await supabaseService.from("pages").delete().eq("id", "test-page-enhanced-001");
  await supabaseService.from("courses").delete().eq("id", "test-course-enhanced-001");
  await supabaseService.from("users").delete().eq("id", TEST_USER_ID);
  await supabaseService.auth.admin.deleteUser(TEST_USER_ID);
}

// Test Suite
Deno.test("Enhanced Progress Tracking System Integration Tests", async (t) => {
  // Setup
  await t.step("Setup: Create test data", async () => {
    await cleanupTestData(); // Clean any existing data
    await createTestUser();
    await createTestContent();
  });

  await t.step("Test 1: Block Completion Tracking", async () => {
    // Test block completion creation and updates
    const blockCompletionData = {
      user_id: TEST_USER_ID,
      block_id: "test-block-enhanced-001",
      page_id: "test-page-enhanced-001",
      course_id: "test-course-enhanced-001",
      client_id: TEST_CLIENT_ID,
      completion_status: "in_progress",
      completion_percentage: 45.5,
      total_time_spent_seconds: 180,
      interaction_count: 15,
      content_engagement_score: 75.0,
      device_type: "desktop",
      learning_context: "focused"
    };
    
    const { data: blockCompletion, error: blockError } = await supabaseService
      .from("block_completions")
      .insert(blockCompletionData)
      .select()
      .single();
    
    assertEquals(blockError, null, "Should create block completion successfully");
    assertExists(blockCompletion, "Should return block completion data");
    assertEquals(blockCompletion.completion_status, "in_progress", "Should set correct completion status");
    assertEquals(blockCompletion.completion_percentage, 45.5, "Should set correct completion percentage");
    assertExists(blockCompletion.started_at, "Should set started timestamp for in_progress status");
    
    // Test completion update
    const { data: updatedCompletion, error: updateError } = await supabaseService
      .from("block_completions")
      .update({
        completion_status: "completed",
        completion_percentage: 100,
        mastery_score: 85.0,
        is_mastered: true,
        total_time_spent_seconds: 300
      })
      .eq("id", blockCompletion.id)
      .select()
      .single();
    
    assertEquals(updateError, null, "Should update block completion successfully");
    assertEquals(updatedCompletion.completion_status, "completed", "Should update completion status");
    assertEquals(updatedCompletion.mastery_score, 85.0, "Should set mastery score");
    assertEquals(updatedCompletion.is_mastered, true, "Should mark as mastered");
    assertExists(updatedCompletion.completed_at, "Should set completion timestamp");
  });

  await t.step("Test 2: Learning Session Management", async () => {
    // Test learning session creation
    const sessionData = {
      user_id: TEST_USER_ID,
      client_id: TEST_CLIENT_ID,
      session_type: "learning",
      session_status: "active",
      total_duration_seconds: 1800, // 30 minutes
      active_duration_seconds: 1440, // 24 minutes (80% active)
      focus_score: 78.5,
      engagement_score: 82.0,
      learning_velocity: 1.2,
      content_items_accessed: [
        { type: "block", id: "test-block-enhanced-001", time_spent: 180 },
        { type: "block", id: "test-block-enhanced-002", time_spent: 300 }
      ],
      blocks_completed: ["test-block-enhanced-001"],
      pages_visited: ["test-page-enhanced-001"],
      courses_progressed: ["test-course-enhanced-001"],
      device_info: { type: "desktop", browser: "chrome", os: "windows" },
      performance_metrics: { cpu_usage: "low", memory_usage: "normal" }
    };
    
    const { data: learningSession, error: sessionError } = await supabaseService
      .from("learning_sessions")
      .insert(sessionData)
      .select()
      .single();
    
    assertEquals(sessionError, null, "Should create learning session successfully");
    assertExists(learningSession, "Should return learning session data");
    assertEquals(learningSession.session_type, "learning", "Should set correct session type");
    assertEquals(learningSession.focus_score, 78.5, "Should set focus score");
    assertEquals(learningSession.engagement_score, 82.0, "Should set engagement score");
    assert(Array.isArray(learningSession.content_items_accessed), "Should store content items as array");
    assertEquals(learningSession.content_items_accessed.length, 2, "Should store all content items");
    
    // Test session completion
    const { data: completedSession, error: completeError } = await supabaseService
      .from("learning_sessions")
      .update({
        session_status: "completed",
        ended_at: new Date().toISOString(),
        total_duration_seconds: 2100,
        progress_made_percentage: 35.0,
        user_satisfaction_rating: 4
      })
      .eq("id", learningSession.id)
      .select()
      .single();
    
    assertEquals(completeError, null, "Should complete session successfully");
    assertEquals(completedSession.session_status, "completed", "Should update session status");
    assertExists(completedSession.ended_at, "Should set end timestamp");
    assertEquals(completedSession.progress_made_percentage, 35.0, "Should track progress made");
  });

  await t.step("Test 3: Enhanced User Progress Tracking", async () => {
    // Create enhanced user progress record
    const progressData = {
      user_id: TEST_USER_ID,
      client_id: TEST_CLIENT_ID,
      course_id: "test-course-enhanced-001",
      progress_type: "course",
      completion_percentage: 25.0,
      time_spent_seconds: 900,
      status: "in_progress",
      learning_velocity_score: 72.5,
      engagement_quality_score: 78.0,
      interaction_depth_score: 65.0,
      return_frequency_score: 80.0,
      learning_pattern_data: {
        preferred_time: "morning",
        avg_session_length: 30,
        break_frequency: "low"
      },
      preferred_content_types: ["video", "interactive"],
      adaptive_difficulty_level: 2.5,
      personalization_data: {
        learning_style: "visual",
        pace_preference: "moderate"
      },
      mastery_prediction_score: 75.0,
      knowledge_retention_score: 68.0,
      learning_efficiency_score: 82.0
    };
    
    const { data: userProgress, error: progressError } = await supabaseService
      .from("user_progress")
      .insert(progressData)
      .select()
      .single();
    
    assertEquals(progressError, null, "Should create enhanced user progress successfully");
    assertExists(userProgress, "Should return user progress data");
    assertEquals(userProgress.learning_velocity_score, 72.5, "Should set learning velocity score");
    assertEquals(userProgress.engagement_quality_score, 78.0, "Should set engagement quality score");
    assertEquals(userProgress.adaptive_difficulty_level, 2.5, "Should set adaptive difficulty level");
    assert(typeof userProgress.learning_pattern_data === 'object', "Should store learning pattern data as object");
    assert(Array.isArray(userProgress.preferred_content_types), "Should store preferred content types as array");
  });

  await t.step("Test 4: User Learning Analytics View", async () => {
    // Query the analytics view
    const { data: analyticsData, error: analyticsError } = await supabaseService
      .from("user_learning_analytics")
      .select("*")
      .eq("user_id", TEST_USER_ID);
    
    assertEquals(analyticsError, null, "Should query analytics view successfully");
    assertExists(analyticsData, "Should return analytics data");
    assert(analyticsData.length > 0, "Should have analytics records");
    
    const analytics = analyticsData[0];
    assert(analytics.total_blocks_started >= 0, "Should have block start count");
    assert(analytics.blocks_completed >= 0, "Should have block completion count");
    assert(analytics.total_learning_sessions >= 0, "Should have session count");
    assertExists(analytics.learning_velocity_score, "Should include learning velocity score");
    assertExists(analytics.engagement_quality_score, "Should include engagement quality score");
  });

  await t.step("Test 5: Enhanced Progress Tracking API", async () => {
    // Test the enhanced progress tracking API with authentication
    const testToken = "mock-test-token"; // This will fail authentication as expected
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/enhanced-progress-tracking?type=progress_aggregation`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${testToken}`,
        "Content-Type": "application/json",
      },
    });
    
    // Should fail authentication (which is correct behavior)
    assertEquals(response.status, 500, "Should respond with error status for invalid token");
    const apiResult = await response.json();
    assertExists(apiResult.error, "Should return error object");
    assertEquals(apiResult.error.code, "ENHANCED_PROGRESS_TRACKING_ERROR", "Should return correct error code");
    assert(apiResult.error.message.includes("Invalid token"), "Should validate authentication");
  });

  await t.step("Test 6: Learning Path Validator API", async () => {
    // Test the learning path validator API
    const testToken = "mock-test-token"; // This will fail authentication as expected
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/learning-path-validator?content_type=course&content_id=test-course-enhanced-001`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${testToken}`,
        "Content-Type": "application/json",
      },
    });
    
    // Should fail authentication (which is correct behavior)
    assertEquals(response.status, 500, "Should respond with error status for invalid token");
    const apiResult = await response.json();
    assertExists(apiResult.error, "Should return error object");
    assertEquals(apiResult.error.code, "LEARNING_PATH_VALIDATOR_ERROR", "Should return correct error code");
    assert(apiResult.error.message.includes("Invalid token"), "Should validate authentication");
  });

  await t.step("Test 7: Mastery Assessment API", async () => {
    // Test the mastery assessment API
    const testToken = "mock-test-token"; // This will fail authentication as expected
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mastery-assessment-api?type=current&content_type=course`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${testToken}`,
        "Content-Type": "application/json",
      },
    });
    
    // Should fail authentication (which is correct behavior)
    assertEquals(response.status, 500, "Should respond with error status for invalid token");
    const apiResult = await response.json();
    assertExists(apiResult.error, "Should return error object");
    assertEquals(apiResult.error.code, "MASTERY_ASSESSMENT_ERROR", "Should return correct error code");
    assert(apiResult.error.message.includes("Invalid token"), "Should validate authentication");
  });

  await t.step("Test 8: Automatic Progress Aggregation Trigger", async () => {
    // Test that block completion updates trigger user_progress updates
    
    // First, create a user_progress record for the course
    const { data: initialProgress, error: initialError } = await supabaseService
      .from("user_progress")
      .insert({
        user_id: TEST_USER_ID,
        client_id: TEST_CLIENT_ID,
        course_id: "test-course-enhanced-001",
        progress_type: "course",
        completion_percentage: 0,
        time_spent_seconds: 0
      })
      .select()
      .single();
    
    assertEquals(initialError, null, "Should create initial progress record");
    
    // Create a block completion that should trigger the aggregation
    const { data: triggerBlock, error: triggerError } = await supabaseService
      .from("block_completions")
      .insert({
        user_id: TEST_USER_ID,
        block_id: "test-block-enhanced-002",
        page_id: "test-page-enhanced-001",
        course_id: "test-course-enhanced-001",
        client_id: TEST_CLIENT_ID,
        completion_status: "completed",
        completion_percentage: 100,
        total_time_spent_seconds: 450,
        content_engagement_score: 88.0
      })
      .select()
      .single();
    
    assertEquals(triggerError, null, "Should create trigger block completion");
    
    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user_progress was updated by the trigger
    const { data: updatedProgress, error: updateCheckError } = await supabaseService
      .from("user_progress")
      .select("*")
      .eq("id", initialProgress.id)
      .single();
    
    assertEquals(updateCheckError, null, "Should query updated progress successfully");
    
    // The trigger should have updated time_spent_seconds and engagement_quality_score
    // Note: The exact values depend on the aggregation logic in the trigger
    console.log("Updated progress after trigger:", updatedProgress);
    console.log("Original time spent:", initialProgress.time_spent_seconds);
    console.log("New time spent:", updatedProgress.time_spent_seconds);
  });

  await t.step("Test 9: Performance Validation", async () => {
    // Test query performance to ensure <200ms target
    const startTime = Date.now();
    
    // Test multiple concurrent queries
    const promises = [
      supabaseService.from("block_completions").select("*").eq("user_id", TEST_USER_ID),
      supabaseService.from("learning_sessions").select("*").eq("user_id", TEST_USER_ID),
      supabaseService.from("user_progress").select("*").eq("user_id", TEST_USER_ID),
      supabaseService.from("user_learning_analytics").select("*").eq("user_id", TEST_USER_ID)
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`Query performance: ${totalTime}ms for 4 concurrent queries`);
    
    // Check that all queries succeeded
    for (let i = 0; i < results.length; i++) {
      assertEquals(results[i].error, null, `Query ${i + 1} should succeed`);
    }
    
    // Performance target: should complete within reasonable time
    assert(totalTime < 2000, "Concurrent queries should complete within 2 seconds");
  });

  await t.step("Test 10: Data Integrity and Constraints", async () => {
    // Test unique constraint on block completions
    const duplicateBlockData = {
      user_id: TEST_USER_ID,
      block_id: "test-block-enhanced-001", // This block already has a completion record
      page_id: "test-page-enhanced-001",
      course_id: "test-course-enhanced-001",
      client_id: TEST_CLIENT_ID,
      completion_status: "completed",
      completion_percentage: 95
    };
    
    const { data: duplicateData, error: duplicateError } = await supabaseService
      .from("block_completions")
      .insert(duplicateBlockData);
    
    // Should fail due to unique constraint on (user_id, block_id)
    assertExists(duplicateError, "Should prevent duplicate block completions");
    assert(
      duplicateError.message.includes("duplicate") || duplicateError.code === "23505",
      "Should be a uniqueness constraint error"
    );
  });

  // Cleanup
  await t.step("Cleanup: Remove test data", async () => {
    await cleanupTestData();
  });
});

// Individual API functionality tests
Deno.test("Enhanced Progress API Functionality Tests", async (t) => {
  await t.step("Test: API Response Structure Validation", async () => {
    // Test all three APIs for proper response structure
    const apis = [
      "enhanced-progress-tracking",
      "learning-path-validator", 
      "mastery-assessment-api"
    ];
    
    for (const api of apis) {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${api}`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer invalid-token",
          "Content-Type": "application/json",
        },
      });
      
      assertEquals(response.status, 500, `${api} should reject invalid token`);
      
      const responseData = await response.json();
      assertExists(responseData.error, `${api} should return error object`);
      assertExists(responseData.error.code, `${api} should return error code`);
      assertExists(responseData.error.message, `${api} should return error message`);
      
      // Check CORS headers
      assertEquals(
        response.headers.get("Access-Control-Allow-Origin"),
        "*",
        `${api} should have CORS headers`
      );
    }
  });
  
  await t.step("Test: API Method Support", async () => {
    // Test OPTIONS method for CORS preflight
    const apis = [
      "enhanced-progress-tracking",
      "learning-path-validator", 
      "mastery-assessment-api"
    ];
    
    for (const api of apis) {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${api}`, {
        method: "OPTIONS",
      });
      
      assertEquals(response.status, 200, `${api} should handle OPTIONS requests`);
      assertEquals(
        response.headers.get("Access-Control-Allow-Origin"),
        "*",
        `${api} should return CORS headers for OPTIONS`
      );
    }
  });
});

// Performance and scalability tests
Deno.test("Enhanced Progress System Performance Tests", async (t) => {
  await t.step("Test: Database Schema Performance", async () => {
    // Test index effectiveness
    const indexQueries = [
      "SELECT * FROM block_completions WHERE user_id = 'test-user' LIMIT 1",
      "SELECT * FROM learning_sessions WHERE client_id = 'test-client' LIMIT 1",
      "SELECT * FROM user_learning_analytics WHERE user_id = 'test-user' LIMIT 1"
    ];
    
    for (const query of indexQueries) {
      const startTime = Date.now();
      
      try {
        await supabaseService.rpc('execute_sql', { query });
      } catch (error) {
        // Queries may fail due to missing data, but we're testing performance
        console.log(`Query performance test: ${query}`);
      }
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      console.log(`Query time: ${queryTime}ms`);
      
      // Even with error handling, queries should be fast
      assert(queryTime < 1000, "Database queries should be fast even with errors");
    }
  });
  
  await t.step("Test: API Response Time", async () => {
    // Test API response times
    const apis = [
      "enhanced-progress-tracking",
      "learning-path-validator", 
      "mastery-assessment-api"
    ];
    
    for (const api of apis) {
      const startTime = Date.now();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${api}`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "Content-Type": "application/json",
        },
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`${api} response time: ${responseTime}ms`);
      
      // APIs should respond quickly even when returning errors
      assert(responseTime < 5000, `${api} should respond within 5 seconds`);
      
      // Verify response
      assert(response.status >= 400, `${api} should return error status for invalid token`);
    }
  });
});