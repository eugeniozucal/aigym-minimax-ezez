import { assertEquals, assertExists, assert } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Test configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data setup
const TEST_CLIENT_ID = "test-client-achievement-integration";
const TEST_USER_EMAIL = "test-achievement@example.com";
const TEST_USER_ID = "test-user-achievement-001";

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
      name: "Test Achievement User",
      role: "student",
      last_activity_at: new Date().toISOString(),
    });
    
  return TEST_USER_ID;
}

async function createTestWOD() {
  const { data, error } = await supabaseService
    .from("wods")
    .insert({
      id: "test-wod-achievement-001",
      client_id: TEST_CLIENT_ID,
      title: "Test WOD for Achievement",
      description: "A test workout for achievement validation",
      difficulty: "beginner",
      duration_minutes: 30,
      workout_data: { exercises: [{ name: "Push-ups", reps: 10 }] },
    })
    .select()
    .single();
    
  if (error) {
    console.log("WOD creation error:", error);
  }
  
  return data;
}

async function createTestCourse() {
  const { data, error } = await supabaseService
    .from("courses")
    .insert({
      id: "test-course-achievement-001",
      client_id: TEST_CLIENT_ID,
      title: "Test Achievement Course",
      description: "Course for achievement testing",
      difficulty: "beginner",
      duration_hours: 10,
      is_active: true,
    })
    .select()
    .single();
    
  if (error) {
    console.log("Course creation error:", error);
  }
  
  return data;
}

async function cleanupTestData() {
  // Clean up in reverse order of dependencies
  await supabaseService.from("user_achievements").delete().eq("user_id", TEST_USER_ID);
  await supabaseService.from("user_streaks").delete().eq("user_id", TEST_USER_ID);
  await supabaseService.from("user_milestone_progress").delete().eq("user_id", TEST_USER_ID);
  await supabaseService.from("user_progress").delete().eq("user_id", TEST_USER_ID);
  await supabaseService.from("course_enrollments").delete().eq("user_id", TEST_USER_ID);
  await supabaseService.from("course_milestones").delete().eq("course_id", "test-course-achievement-001");
  await supabaseService.from("courses").delete().eq("id", "test-course-achievement-001");
  await supabaseService.from("wods").delete().eq("id", "test-wod-achievement-001");
  await supabaseService.from("users").delete().eq("id", TEST_USER_ID);
  await supabaseService.auth.admin.deleteUser(TEST_USER_ID);
}

// Test Suite
Deno.test("Achievement System Integration Tests", async (t) => {
  // Setup
  await t.step("Setup: Create test data", async () => {
    await cleanupTestData(); // Clean any existing data
    await createTestUser();
    await createTestWOD();
    await createTestCourse();
  });

  await t.step("Test 1: WOD Completion Achievement", async () => {
    // Simulate WOD completion
    const { data: progressData, error: progressError } = await supabaseService
      .from("user_progress")
      .insert({
        user_id: TEST_USER_ID,
        client_id: TEST_CLIENT_ID,
        content_type: "wod",
        content_id: "test-wod-achievement-001",
        status: "completed",
        completion_percentage: 100,
        time_spent_seconds: 1800, // 30 minutes
        last_accessed_at: new Date().toISOString(),
      });
    
    assertEquals(progressError, null, "Should create progress record successfully");
    
    // Trigger milestone validation
    const response = await fetch(`${SUPABASE_URL}/functions/v1/milestone-validation-api`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        action_type: "wod_completed",
        content_id: "test-wod-achievement-001",
      }),
    });
    
    assertEquals(response.status, 200, "Milestone validation should succeed");
    const validationResult = await response.json();
    assertExists(validationResult.data, "Should return validation data");
    
    // Check if WOD completion achievement was awarded
    const { data: userAchievements, error: achievementError } = await supabaseService
      .from("user_achievements")
      .select(`
        *,
        achievements (name, type, category)
      `)
      .eq("user_id", TEST_USER_ID)
      .eq("achievements.type", "completion");
    
    assertEquals(achievementError, null, "Should query user achievements successfully");
    assert(userAchievements && userAchievements.length > 0, "Should have at least one completion achievement");
    
    // Verify WOD completion achievement specifically
    const wodAchievement = userAchievements?.find(
      (ua: any) => ua.achievements.category === "wod" && ua.achievements.name.includes("First WOD")
    );
    assertExists(wodAchievement, "Should have WOD completion achievement");
  });

  await t.step("Test 2: Login Streak Achievement", async () => {
    // Simulate consecutive daily logins
    const today = new Date();
    const loginDates = [];
    
    // Create 7 consecutive login records
    for (let i = 0; i < 7; i++) {
      const loginDate = new Date(today);
      loginDate.setDate(today.getDate() - i);
      loginDates.push(loginDate.toISOString().split('T')[0]);
    }
    
    // Update user's last activity and create streak record
    await supabaseService
      .from("users")
      .update({ last_activity_at: today.toISOString() })
      .eq("id", TEST_USER_ID);
    
    // Create streak record
    await supabaseService
      .from("user_streaks")
      .upsert({
        user_id: TEST_USER_ID,
        client_id: TEST_CLIENT_ID,
        streak_type: "daily_login",
        current_count: 7,
        longest_count: 7,
        last_activity_date: today.toISOString().split('T')[0],
      });
    
    // Trigger milestone validation for streak achievement
    const response = await fetch(`${SUPABASE_URL}/functions/v1/milestone-validation-api`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        action_type: "daily_login",
        streak_count: 7,
      }),
    });
    
    assertEquals(response.status, 200, "Streak validation should succeed");
    
    // Check if streak achievement was awarded
    const { data: streakAchievements, error: streakError } = await supabaseService
      .from("user_achievements")
      .select(`
        *,
        achievements (name, type, category)
      `)
      .eq("user_id", TEST_USER_ID)
      .eq("achievements.type", "streak");
    
    assertEquals(streakError, null, "Should query streak achievements successfully");
    assert(streakAchievements && streakAchievements.length > 0, "Should have at least one streak achievement");
    
    // Verify 7-day streak achievement
    const weekStreakAchievement = streakAchievements?.find(
      (ua: any) => ua.achievements.name.includes("Week Warrior")
    );
    assertExists(weekStreakAchievement, "Should have 7-day streak achievement");
  });

  await t.step("Test 3: Course Milestone Achievement", async () => {
    // Create course milestone
    const { data: milestoneData, error: milestoneError } = await supabaseService
      .from("course_milestones")
      .insert({
        id: "test-milestone-001",
        course_id: "test-course-achievement-001",
        client_id: TEST_CLIENT_ID,
        title: "Course Introduction Complete",
        description: "Complete the course introduction section",
        type: "knowledge_check",
        sort_order: 1,
        unlock_criteria: { progress_percentage: 25 },
        is_required: true,
      })
      .select()
      .single();
    
    assertEquals(milestoneError, null, "Should create milestone successfully");
    
    // Enroll user in course
    await supabaseService
      .from("course_enrollments")
      .insert({
        user_id: TEST_USER_ID,
        course_id: "test-course-achievement-001",
        client_id: TEST_CLIENT_ID,
        enrollment_date: new Date().toISOString(),
        status: "active",
      });
    
    // Create progress that meets milestone criteria
    await supabaseService
      .from("user_progress")
      .insert({
        user_id: TEST_USER_ID,
        client_id: TEST_CLIENT_ID,
        content_type: "course",
        content_id: "test-course-achievement-001",
        status: "in_progress",
        completion_percentage: 30, // Exceeds milestone requirement of 25%
        time_spent_seconds: 3600,
        last_accessed_at: new Date().toISOString(),
      });
    
    // Trigger milestone validation
    const response = await fetch(`${SUPABASE_URL}/functions/v1/milestone-validation-api`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        action_type: "course_progress",
        content_id: "test-course-achievement-001",
        progress_percentage: 30,
      }),
    });
    
    assertEquals(response.status, 200, "Course milestone validation should succeed");
    
    // Check milestone progress
    const { data: milestoneProgress, error: progressError } = await supabaseService
      .from("user_milestone_progress")
      .select("*")
      .eq("user_id", TEST_USER_ID)
      .eq("milestone_id", "test-milestone-001");
    
    assertEquals(progressError, null, "Should query milestone progress successfully");
    assert(milestoneProgress && milestoneProgress.length > 0, "Should have milestone progress record");
    assertEquals(milestoneProgress[0].is_completed, true, "Milestone should be marked as completed");
  });

  await t.step("Test 4: Achievement API Functionality", async () => {
    // Test achievements API - get user achievements
    const response = await fetch(`${SUPABASE_URL}/functions/v1/achievements-api?user_id=${TEST_USER_ID}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    assertEquals(response.status, 200, "Achievements API should respond successfully");
    const apiResult = await response.json();
    assertExists(apiResult.data, "Should return achievement data");
    
    // Verify achievement data structure
    assert(Array.isArray(apiResult.data), "Should return achievements array");
    assert(apiResult.data.length > 0, "Should have earned achievements from previous tests");
    
    // Test getting all achievements (catalog)
    const catalogResponse = await fetch(`${SUPABASE_URL}/functions/v1/achievements-api`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    assertEquals(catalogResponse.status, 200, "Achievement catalog should load successfully");
    const catalogResult = await catalogResponse.json();
    assertExists(catalogResult.data, "Should return achievement catalog");
    assert(Array.isArray(catalogResult.data), "Catalog should be an array");
    assert(catalogResult.data.length >= 34, "Should have at least the seeded achievements");
  });

  await t.step("Test 5: Achievement Statistics and Analytics", async () => {
    // Get achievement statistics
    const { data: achievementStats, error: statsError } = await supabaseService
      .rpc("get_achievement_statistics", { 
        target_client_id: TEST_CLIENT_ID,
        target_user_id: TEST_USER_ID 
      });
    
    // Note: This RPC function might not exist yet, so we'll test direct queries
    const { count: userAchievementCount, error: countError } = await supabaseService
      .from("user_achievements")
      .select("*", { count: "exact", head: true })
      .eq("user_id", TEST_USER_ID);
    
    assertEquals(countError, null, "Should count user achievements successfully");
    assert(userAchievementCount && userAchievementCount >= 2, "Should have multiple achievements from tests");
    
    // Test achievement categories
    const { data: achievementsByCategory, error: categoryError } = await supabaseService
      .from("user_achievements")
      .select(`
        achievements (category, type)
      `)
      .eq("user_id", TEST_USER_ID);
    
    assertEquals(categoryError, null, "Should query achievements by category successfully");
    assertExists(achievementsByCategory, "Should return categorized achievements");
    
    // Verify we have achievements from different categories
    const categories = achievementsByCategory?.map((ua: any) => ua.achievements.category) || [];
    const uniqueCategories = [...new Set(categories)];
    assert(uniqueCategories.length > 1, "Should have achievements from multiple categories");
  });

  // Cleanup
  await t.step("Cleanup: Remove test data", async () => {
    await cleanupTestData();
  });
});

// Individual test functions for specific scenarios
Deno.test("Achievement Edge Cases", async (t) => {
  await t.step("Test: Duplicate achievement prevention", async () => {
    await createTestUser();
    
    // Try to award the same achievement twice
    const achievementId = "first-wod-completed";
    
    // First award
    const { error: firstError } = await supabaseService
      .from("user_achievements")
      .insert({
        user_id: TEST_USER_ID,
        achievement_id: achievementId,
        client_id: TEST_CLIENT_ID,
        earned_at: new Date().toISOString(),
        context_data: { wod_id: "test-wod-achievement-001" },
      });
    
    assertEquals(firstError, null, "First achievement award should succeed");
    
    // Second attempt (should fail due to unique constraint)
    const { error: secondError } = await supabaseService
      .from("user_achievements")
      .insert({
        user_id: TEST_USER_ID,
        achievement_id: achievementId,
        client_id: TEST_CLIENT_ID,
        earned_at: new Date().toISOString(),
        context_data: { wod_id: "test-wod-achievement-001" },
      });
    
    assertExists(secondError, "Duplicate achievement should be prevented");
    assert(secondError.message.includes("duplicate") || secondError.code === "23505", "Should be a uniqueness constraint error");
    
    await cleanupTestData();
  });

  await t.step("Test: Achievement progress tracking", async () => {
    await createTestUser();
    
    // Test progressive achievement (e.g., complete X WODs)
    const progressiveAchievementId = "wod-warrior-10";
    
    // Simulate completing multiple WODs
    for (let i = 1; i <= 5; i++) {
      await supabaseService
        .from("user_progress")
        .insert({
          user_id: TEST_USER_ID,
          client_id: TEST_CLIENT_ID,
          content_type: "wod",
          content_id: `test-wod-${i}`,
          status: "completed",
          completion_percentage: 100,
          time_spent_seconds: 1800,
          last_accessed_at: new Date().toISOString(),
        });
    }
    
    // Check current progress towards 10 WODs achievement
    const { count: wodCount, error: countError } = await supabaseService
      .from("user_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", TEST_USER_ID)
      .eq("content_type", "wod")
      .eq("status", "completed");
    
    assertEquals(countError, null, "Should count completed WODs successfully");
    assertEquals(wodCount, 5, "Should have completed 5 WODs");
    
    // This achievement shouldn't be awarded yet (needs 10)
    const { data: prematureAchievement, error: prematureError } = await supabaseService
      .from("user_achievements")
      .select("*")
      .eq("user_id", TEST_USER_ID)
      .eq("achievement_id", progressiveAchievementId);
    
    assertEquals(prematureError, null, "Should query achievements successfully");
    assertEquals(prematureAchievement?.length || 0, 0, "Should not have 10-WOD achievement yet");
    
    await cleanupTestData();
  });
});

Deno.test("Performance and Scalability Tests", async (t) => {
  await t.step("Test: Bulk achievement validation performance", async () => {
    await createTestUser();
    
    // Create multiple progress records quickly
    const startTime = Date.now();
    const progressRecords = [];
    
    for (let i = 1; i <= 50; i++) {
      progressRecords.push({
        user_id: TEST_USER_ID,
        client_id: TEST_CLIENT_ID,
        content_type: "wod",
        content_id: `bulk-test-wod-${i}`,
        status: "completed",
        completion_percentage: 100,
        time_spent_seconds: 1800,
        last_accessed_at: new Date().toISOString(),
      });
    }
    
    const { error: bulkInsertError } = await supabaseService
      .from("user_progress")
      .insert(progressRecords);
    
    assertEquals(bulkInsertError, null, "Bulk progress insert should succeed");
    
    // Trigger bulk validation
    const response = await fetch(`${SUPABASE_URL}/functions/v1/milestone-validation-api`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        action_type: "bulk_validation",
        validate_all: true,
      }),
    });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    assertEquals(response.status, 200, "Bulk validation should succeed");
    assert(processingTime < 10000, "Bulk validation should complete within 10 seconds");
    
    console.log(`Bulk validation processed 50 records in ${processingTime}ms`);
    
    await cleanupTestData();
  });
});
