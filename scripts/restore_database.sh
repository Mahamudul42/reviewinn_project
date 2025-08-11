#!/bin/bash

# Database Restore Script for ReviewInn
# This script restores PostgreSQL database from backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables safely
if [ -f ".env" ]; then
    while IFS= read -r line; do
        if [[ $line == *"="* ]] && [[ $line != "#"* ]] && [[ -n $line ]]; then
            key=$(echo "$line" | cut -d= -f1)
            value=$(echo "$line" | cut -d= -f2-)
            export "$key"="$value"
        fi
    done < .env
fi

# Default values if not set in .env
POSTGRES_USER=${POSTGRES_USER:-review_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"ReviewInn2024!SecurePass#Dev"}
POSTGRES_DB=${POSTGRES_DB:-review_platform}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

# Function to print colored output
print_status() {
    echo -e "${GREEN}[RESTORE]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if database is accessible
check_database() {
    print_status "Checking database connectivity..."
    
    # Try to connect via docker container first
    if docker exec postgres_db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        print_status "Database is accessible via Docker container"
        USE_DOCKER=true
        return 0
    fi
    
    # Try direct connection
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' >/dev/null 2>&1; then
        print_status "Database is accessible via direct connection"
        USE_DOCKER=false
        return 0
    fi
    
    print_error "Cannot connect to database. Make sure the database is running."
    return 1
}

# Function to detect backup type
detect_backup_type() {
    local backup_file="$1"
    
    if [[ "$backup_file" == *.backup ]]; then
        echo "custom"
    elif [[ "$backup_file" == *.sql ]]; then
        echo "sql"
    else
        # Try to detect by content
        if file "$backup_file" | grep -q "PostgreSQL custom database dump"; then
            echo "custom"
        elif head -10 "$backup_file" | grep -q "PostgreSQL database dump"; then
            echo "sql"
        else
            echo "unknown"
        fi
    fi
}

# Function to create pre-restore backup
create_pre_restore_backup() {
    print_warning "Creating backup before restore..."
    local pre_backup_dir="./backups/pre_restore"
    local date=$(date +"%Y%m%d_%H%M%S")
    
    mkdir -p "$pre_backup_dir"
    
    local backup_file="$pre_backup_dir/pre_restore_backup_${date}.backup"
    
    if [ "$USE_DOCKER" = true ]; then
        docker exec postgres_db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -v -f "/tmp/pre_restore.backup"
        docker cp postgres_db:/tmp/pre_restore.backup "$backup_file"
        docker exec postgres_db rm -f /tmp/pre_restore.backup
    else
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -v -f "$backup_file"
    fi
    
    if [ -f "$backup_file" ]; then
        print_status "Pre-restore backup created: $backup_file"
        echo "$backup_file"
    else
        print_error "Failed to create pre-restore backup!"
        return 1
    fi
}

# Function to restore from custom format backup
restore_custom_backup() {
    local backup_file="$1"
    local clean_restore="$2"
    
    print_status "Restoring from custom format backup: $backup_file"
    
    # Restore options
    local restore_options="-v --no-owner --no-privileges"
    if [ "$clean_restore" = true ]; then
        restore_options="$restore_options --clean --if-exists"
    fi
    
    if [ "$USE_DOCKER" = true ]; then
        # Copy backup file to container
        docker cp "$backup_file" postgres_db:/tmp/restore.backup
        
        # Restore database
        docker exec postgres_db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" $restore_options /tmp/restore.backup
        
        # Clean up
        docker exec postgres_db rm -f /tmp/restore.backup
    else
        PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" $restore_options "$backup_file"
    fi
    
    print_status "Custom format restore completed"
}

# Function to restore from SQL backup
restore_sql_backup() {
    local backup_file="$1"
    local clean_restore="$2"
    
    print_status "Restoring from SQL backup: $backup_file"
    
    if [ "$clean_restore" = true ]; then
        print_warning "Dropping and recreating database for clean restore..."
        
        if [ "$USE_DOCKER" = true ]; then
            # Drop and recreate database
            docker exec postgres_db psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
            docker exec postgres_db psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;"
        else
            PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
            PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;"
        fi
    fi
    
    if [ "$USE_DOCKER" = true ]; then
        # Copy SQL file to container and restore
        docker cp "$backup_file" postgres_db:/tmp/restore.sql
        docker exec postgres_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/restore.sql
        docker exec postgres_db rm -f /tmp/restore.sql
    else
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$backup_file"
    fi
    
    print_status "SQL restore completed"
}

# Function to verify restore
verify_restore() {
    print_status "Verifying restore..."
    
    if [ "$USE_DOCKER" = true ]; then
        # Check if tables exist and have data
        local table_count=$(docker exec postgres_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        local user_count=$(docker exec postgres_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
        local entity_count=$(docker exec postgres_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM entities;" 2>/dev/null || echo "0")
        local review_count=$(docker exec postgres_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM reviews;" 2>/dev/null || echo "0")
    else
        local table_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        local user_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
        local entity_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM entities;" 2>/dev/null || echo "0")
        local review_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM reviews;" 2>/dev/null || echo "0")
    fi
    
    # Remove whitespace
    table_count=$(echo $table_count | tr -d ' ')
    user_count=$(echo $user_count | tr -d ' ')
    entity_count=$(echo $entity_count | tr -d ' ')
    review_count=$(echo $review_count | tr -d ' ')
    
    print_status "Restore verification:"
    print_status "  Tables: $table_count"
    print_status "  Users: $user_count"
    print_status "  Entities: $entity_count"
    print_status "  Reviews: $review_count"
    
    if [ "$table_count" -gt 0 ]; then
        print_status "Database restore appears successful!"
        return 0
    else
        print_error "Database restore may have failed - no tables found"
        return 1
    fi
}

# Function to list available backups
list_backups() {
    print_header "Available Backups"
    
    if [ ! -d "./backups" ]; then
        print_warning "No backup directory found"
        return 1
    fi
    
    print_status "Custom format backups (.backup files):"
    ls -lht ./backups/*_custom_*.backup 2>/dev/null | head -10 || print_status "  No custom backups found"
    
    echo ""
    print_status "SQL dump backups (.sql files):"
    ls -lht ./backups/*_sql_*.sql 2>/dev/null | head -10 || print_status "  No SQL backups found"
    
    echo ""
    print_status "Data-only backups:"
    ls -lht ./backups/*_data_*.sql 2>/dev/null | head -5 || print_status "  No data backups found"
    
    echo ""
    print_status "Critical tables backups:"
    ls -lht ./backups/*_critical_*.sql 2>/dev/null | head -5 || print_status "  No critical backups found"
    
    echo ""
    print_status "Pre-restore backups:"
    ls -lht ./backups/pre_restore/*.backup 2>/dev/null | head -5 || print_status "  No pre-restore backups found"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] <backup_file>"
    echo ""
    echo "Options:"
    echo "  --clean         Clean restore (drop existing data)"
    echo "  --no-backup     Skip pre-restore backup"
    echo "  --list          List available backups"
    echo "  --help          Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --list"
    echo "  $0 ./backups/reviewinn_backup_custom_20231127_143000.backup"
    echo "  $0 --clean ./backups/reviewinn_backup_sql_20231127_143000.sql"
    echo "  $0 --no-backup ./backups/reviewinn_backup_data_20231127_143000.sql"
}

# Main restore function
main_restore() {
    local backup_file="$1"
    local clean_restore="$2"
    local skip_backup="$3"
    
    print_header "Database Restore"
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        print_status "Use --list to see available backups"
        exit 1
    fi
    
    # Check database connectivity
    if ! check_database; then
        exit 1
    fi
    
    # Show backup info
    local backup_type=$(detect_backup_type "$backup_file")
    local backup_size=$(du -h "$backup_file" | cut -f1)
    
    print_status "Backup file: $backup_file"
    print_status "Backup type: $backup_type"
    print_status "Backup size: $backup_size"
    
    # Confirm restore
    print_warning "This will restore the database and may overwrite existing data!"
    if [ "$clean_restore" = true ]; then
        print_warning "CLEAN RESTORE: All existing data will be deleted!"
    fi
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restore cancelled"
        exit 0
    fi
    
    # Create pre-restore backup
    if [ "$skip_backup" != true ]; then
        if ! create_pre_restore_backup; then
            print_error "Failed to create pre-restore backup. Aborting."
            exit 1
        fi
    fi
    
    # Perform restore based on backup type
    case "$backup_type" in
        "custom")
            restore_custom_backup "$backup_file" "$clean_restore"
            ;;
        "sql")
            restore_sql_backup "$backup_file" "$clean_restore"
            ;;
        *)
            print_error "Unknown or unsupported backup type: $backup_type"
            exit 1
            ;;
    esac
    
    # Verify restore
    if verify_restore; then
        print_header "Restore Completed Successfully"
        print_status "Database has been restored from: $backup_file"
    else
        print_error "Restore verification failed!"
        exit 1
    fi
}

# Parse command line arguments
CLEAN_RESTORE=false
SKIP_BACKUP=false
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN_RESTORE=true
            shift
            ;;
        --no-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --list)
            list_backups
            exit 0
            ;;
        --help)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [ -z "$BACKUP_FILE" ]; then
                BACKUP_FILE="$1"
            else
                print_error "Multiple backup files specified"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    print_error "No backup file specified"
    echo ""
    show_usage
    exit 1
fi

# Run restore
main_restore "$BACKUP_FILE" "$CLEAN_RESTORE" "$SKIP_BACKUP"