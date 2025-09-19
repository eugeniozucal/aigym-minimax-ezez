#!/bin/bash
# deploy-enterprise-schema.sh
# Enterprise Database Deployment Script
# Author: MiniMax Agent
# Version: 1.0

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/migrations"
LOG_FILE="${SCRIPT_DIR}/deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

# Check required environment variables
check_environment() {
    log "Checking environment variables..."
    
    if [ -z "${DATABASE_URL:-}" ]; then
        error "DATABASE_URL environment variable is required"
    fi
    
    if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
        warn "SUPABASE_SERVICE_ROLE_KEY not set - some operations may fail"
    fi
    
    success "Environment variables validated"
}

# Verify database connection
check_database_connection() {
    log "Testing database connection..."
    
    if ! psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
        error "Cannot connect to database. Please check DATABASE_URL"
    fi
    
    success "Database connection verified"
}

# Create backup before deployment
create_backup() {
    log "Creating pre-deployment backup..."
    
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump "$DATABASE_URL" > "${SCRIPT_DIR}/${backup_file}" 2>/dev/null; then
        success "Backup created: ${backup_file}"
        echo "BACKUP_FILE=${backup_file}" >> "${SCRIPT_DIR}/.env.backup"
    else
        warn "Backup creation failed - continuing with deployment"
    fi
}

# Execute migration file
execute_migration() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file" .sql)
    
    log "Executing migration: $migration_name"
    
    if psql "$DATABASE_URL" -f "$migration_file" > /dev/null 2>&1; then
        success "Migration completed: $migration_name"
        return 0
    else
        error "Migration failed: $migration_name"
        return 1
    fi
}

# Verify schema after deployment
verify_schema() {
    log "Verifying schema deployment..."
    
    # Check if schema_migrations table exists
    local migrations_count
    migrations_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schema_migrations;" 2>/dev/null || echo "0")
    
    if [ "$migrations_count" -ge "3" ]; then
        success "Schema verification passed - $migrations_count migrations applied"
    else
        error "Schema verification failed - expected at least 3 migrations, found $migrations_count"
    fi
    
    # Check critical tables exist
    local tables=("user_profiles" "content_items" "conversations" "content_assignments")
    for table in "${tables[@]}"; do
        if psql "$DATABASE_URL" -c "\d $table" > /dev/null 2>&1; then
            log "✓ Table exists: $table"
        else
            error "✗ Missing critical table: $table"
        fi
    done
    
    success "All critical tables verified"
}

# Verify RLS policies
verify_rls_policies() {
    log "Verifying RLS policies..."
    
    local policy_count
    policy_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" 2>/dev/null || echo "0")
    
    if [ "$policy_count" -ge "10" ]; then
        success "RLS policies verified - $policy_count policies found"
    else
        warn "Expected more RLS policies - found $policy_count"
    fi
}

# Performance check
check_performance() {
    log "Running performance checks..."
    
    # Check if pg_stat_statements extension is available
    if psql "$DATABASE_URL" -c "SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';" | grep -q "pg_stat_statements"; then
        log "✓ pg_stat_statements extension available"
    else
        warn "pg_stat_statements extension not available - performance monitoring limited"
    fi
    
    # Check index usage
    local index_count
    index_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null || echo "0")
    
    log "Performance indexes created: $index_count"
}

# Main deployment function
deploy() {
    log "Starting enterprise database deployment..."
    
    # Pre-deployment checks
    check_environment
    check_database_connection
    create_backup
    
    # Execute migrations in order
    local migrations=(
        "001_create_enterprise_schema.sql"
        "002_create_indexes.sql"
        "003_create_rls_policies.sql"
    )
    
    for migration in "${migrations[@]}"; do
        if [ -f "${MIGRATIONS_DIR}/${migration}" ]; then
            execute_migration "${MIGRATIONS_DIR}/${migration}"
        else
            error "Migration file not found: $migration"
        fi
    done
    
    # Post-deployment verification
    verify_schema
    verify_rls_policies
    check_performance
    
    success "Enterprise database deployment completed successfully!"
    log "Deployment completed at $(date)"
}

# Rollback function
rollback() {
    log "Starting rollback process..."
    
    if [ -f "${SCRIPT_DIR}/.env.backup" ]; then
        source "${SCRIPT_DIR}/.env.backup"
        
        if [ -n "${BACKUP_FILE:-}" ] && [ -f "${SCRIPT_DIR}/${BACKUP_FILE}" ]; then
            log "Restoring from backup: $BACKUP_FILE"
            
            if psql "$DATABASE_URL" < "${SCRIPT_DIR}/${BACKUP_FILE}" > /dev/null 2>&1; then
                success "Database restored from backup"
            else
                error "Failed to restore from backup"
            fi
        else
            error "Backup file not found - cannot rollback"
        fi
    else
        error "No backup information found - cannot rollback"
    fi
}

# Emergency rollback (drops new schema)
emergency_rollback() {
    log "Starting emergency rollback..."
    
    warn "This will drop all enterprise schema changes!"
    read -p "Are you sure you want to proceed? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        log "Executing emergency rollback..."
        
        # Drop tables in reverse dependency order
        psql "$DATABASE_URL" <<EOF
BEGIN;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS content_assignments CASCADE;
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS content_versions CASCADE;
DROP TABLE IF EXISTS content_items CASCADE;
DROP TABLE IF EXISTS content_repositories CASCADE;
DROP TABLE IF EXISTS admin_permissions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;
COMMIT;
EOF
        
        success "Emergency rollback completed"
    else
        log "Emergency rollback cancelled"
    fi
}

# Usage information
usage() {
    echo "Usage: $0 [deploy|rollback|emergency-rollback|verify]"
    echo ""
    echo "Commands:"
    echo "  deploy           - Deploy the enterprise database schema"
    echo "  rollback         - Rollback to pre-deployment backup"
    echo "  emergency-rollback - Drop all enterprise schema (destructive)"
    echo "  verify           - Verify current schema state"
    echo ""
    echo "Environment Variables:"
    echo "  DATABASE_URL                - Required: PostgreSQL connection string"
    echo "  SUPABASE_SERVICE_ROLE_KEY   - Optional: For additional operations"
}

# Main script logic
main() {
    case "${1:-}" in
        "deploy")
            deploy
            ;;
        "rollback")
            rollback
            ;;
        "emergency-rollback")
            emergency_rollback
            ;;
        "verify")
            verify_schema
            verify_rls_policies
            ;;
        "help"|"--help"|"")
            usage
            ;;
        *)
            error "Unknown command: $1"
            usage
            exit 1
            ;;
    esac
}

# Initialize log file
echo "=== Enterprise Database Deployment Log ===" > "$LOG_FILE"
echo "Started at: $(date)" >> "$LOG_FILE"

# Run main function
main "$@"