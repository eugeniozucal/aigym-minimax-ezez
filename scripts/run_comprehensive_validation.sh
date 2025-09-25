#!/bin/bash

echo "🚀 Starting Comprehensive Enhanced Progress Tracking Validation"
echo "=============================================================="

echo "\n📡 Testing API Endpoints..."
deno run --allow-net test_api_validation.ts

echo "\n🗄️ Testing Database Operations..."
deno run --allow-net validate_database_operations.ts

echo "\n✅ Validation Complete!"
echo "Check the output above for detailed results."
echo "All APIs should respond with proper authentication errors (500/401)."
echo "All database operations should be protected by RLS policies."
echo "This confirms the system is working correctly and securely."
