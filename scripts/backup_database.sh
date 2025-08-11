#!/bin/bash

# Database Backup Script for ReviewInn
# This script creates comprehensive backups of the PostgreSQL database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables safely
# Try to load from docker-compose environment variables first
if [ -f "reviewinn-backend/.env" ]; then
    while IFS= read -r line; do
        if [[ $line == *"="* ]] && [[ $line != "#"* ]] && [[ -n $line ]]; then
            key=$(echo "$line" | cut -d= -f1)
            value=$(echo "$line" | cut -d= -f2-)
            export "$key"="$value"
        fi
    done < reviewinn-backend/.env
elif [ -f ".env" ]; then
    while IFS= read -r line; do
        if [[ $line == *"="* ]] && [[ $line != "#"* ]] && [[ -n $line ]]; then
            key=$(echo "$line" | cut -d= -f1)
            value=$(echo "$line" | cut -d= -f2-)
            export "$key"="$value"
        fi
    done < .env
fi

# Default values if not set in .env (using current working credentials)
POSTGRES_USER=${POSTGRES_USER:-reviewinn_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"Munna1992"}
POSTGRES_DB=${POSTGRES_DB:-reviewinn_db}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

# Backup directory
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_PREFIX="reviewinn_backup"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[BACKUP]${NC} $1"
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

# Function to create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_status "Created backup directory: $BACKUP_DIR"
    fi
}

# Function to check if database is accessible
check_database() {
    print_status "Checking database connectivity..."
    
    # Try to connect via docker container first (with timeout)
    if timeout 10 docker exec reviewinn_database pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        print_status "Database is accessible via Docker container"
        USE_DOCKER=true
        return 0
    fi
    
    # Try direct connection (with timeout)
    if timeout 10 bash -c "PGPASSWORD='$POSTGRES_PASSWORD' psql -h '$POSTGRES_HOST' -p '$POSTGRES_PORT' -U '$POSTGRES_USER' -d '$POSTGRES_DB' -c '\q'" >/dev/null 2>&1; then
        print_status "Database is accessible via direct connection"
        USE_DOCKER=false
        return 0
    fi
    
    print_warning "Cannot connect to database (connection timed out after 10 seconds)"
    print_warning "Database may not be running or is starting up"
    return 1
}

# Function to get database stats
get_database_stats() {
    print_status "Getting database statistics..."
    
    if [ "$USE_DOCKER" = true ]; then
        docker exec reviewinn_database psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
            SELECT 
                schemaname,
                relname as tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                n_live_tup as live_rows,
                n_dead_tup as dead_rows
            FROM pg_stat_user_tables 
            ORDER BY n_live_tup DESC;
        "
    else
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
            SELECT 
                schemaname,
                relname as tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                n_live_tup as live_rows,
                n_dead_tup as dead_rows
            FROM pg_stat_user_tables 
            ORDER BY n_live_tup DESC;
        "
    fi
}

# Function to create custom format backup (recommended)
create_custom_backup() {
    local backup_file="$BACKUP_DIR/${BACKUP_PREFIX}_custom_${DATE}.backup"
    
    print_status "Creating custom format backup: $backup_file"
    
    if [ "$USE_DOCKER" = true ]; then
        docker exec reviewinn_database pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -v -f "/tmp/backup.backup"
        docker cp reviewinn_database:/tmp/backup.backup "$backup_file"
        docker exec reviewinn_database rm -f /tmp/backup.backup
    else
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -v -f "$backup_file"
    fi
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        print_status "Custom backup completed: $backup_file ($size)"
        echo "$backup_file"
    else
        print_error "Custom backup failed!"
        return 1
    fi
}

# Function to create SQL dump backup
create_sql_backup() {
    local backup_file="$BACKUP_DIR/${BACKUP_PREFIX}_sql_${DATE}.sql"
    
    print_status "Creating SQL dump backup: $backup_file"
    
    if [ "$USE_DOCKER" = true ]; then
        docker exec reviewinn_database pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --create -v > "$backup_file"
    else
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --create -v > "$backup_file"
    fi
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        print_status "SQL backup completed: $backup_file ($size)"
        echo "$backup_file"
    else
        print_error "SQL backup failed!"
        return 1
    fi
}

# Function to create data-only backup
create_data_backup() {
    local backup_file="$BACKUP_DIR/${BACKUP_PREFIX}_data_${DATE}.sql"
    
    print_status "Creating data-only backup: $backup_file"
    
    if [ "$USE_DOCKER" = true ]; then
        docker exec reviewinn_database pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --data-only --column-inserts -v > "$backup_file"
    else
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --data-only --column-inserts -v > "$backup_file"
    fi
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        print_status "Data backup completed: $backup_file ($size)"
        echo "$backup_file"
    else
        print_error "Data backup failed!"
        return 1
    fi
}

# Function to backup specific tables with critical data
backup_critical_tables() {
    local backup_file="$BACKUP_DIR/${BACKUP_PREFIX}_critical_${DATE}.sql"
    local critical_tables="users user_profiles entities reviews categories subcategories unified_categories"
    
    print_status "Creating backup of critical tables: $critical_tables"
    
    if [ "$USE_DOCKER" = true ]; then
        docker exec reviewinn_database pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
            --data-only --column-inserts \
            $(for table in $critical_tables; do echo "-t $table"; done) \
            -v > "$backup_file"
    else
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
            --data-only --column-inserts \
            $(for table in $critical_tables; do echo "-t $table"; done) \
            -v > "$backup_file"
    fi
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        print_status "Critical tables backup completed: $backup_file ($size)"
        echo "$backup_file"
    else
        print_error "Critical tables backup failed!"
        return 1
    fi
}

# Function to create backup metadata
create_backup_metadata() {
    local metadata_file="$BACKUP_DIR/${BACKUP_PREFIX}_metadata_${DATE}.txt"
    
    print_status "Creating backup metadata: $metadata_file"
    
    cat > "$metadata_file" << EOF
=== Review Site Database Backup Metadata ===
Backup Date: $(date)
Database: $POSTGRES_DB
User: $POSTGRES_USER
Host: $POSTGRES_HOST:$POSTGRES_PORT
Backup ID: $DATE

=== System Information ===
OS: $(uname -a)
Docker Version: $(docker --version)
PostgreSQL Version: $( [ "$USE_DOCKER" = true ] && docker exec reviewinn_database postgres --version || echo "N/A")

=== Database Statistics ===
EOF

    # Add database stats to metadata
    if [ "$USE_DOCKER" = true ]; then
        docker exec reviewinn_database psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
            SELECT 
                'Tables: ' || count(*) as info
            FROM information_schema.tables 
            WHERE table_schema = 'public';
            
            SELECT 
                'Total Size: ' || pg_size_pretty(pg_database_size('$POSTGRES_DB')) as info;
        " >> "$metadata_file"
    fi
    
    print_status "Metadata created: $metadata_file"
}

# Function to cleanup old backups (keep latest 5 backup files only)
cleanup_old_backups() {
    print_status "Cleaning up old backups (keeping latest 5 backup files only)..."
    
    # Count backup files
    local backup_count=$(ls -1 "$BACKUP_DIR"/${BACKUP_PREFIX}_custom_*.backup 2>/dev/null | wc -l)
    
    if [ "$backup_count" -gt 5 ]; then
        print_status "Found $backup_count backups, removing old backups (keeping latest 5)..."
        
        # Keep latest 5 backups, delete the rest
        # ls -1t sorts by modification time (newest first)
        # tail -n +6 gets everything from line 6 onwards (i.e., skip first 5, delete rest)
        ls -1t "$BACKUP_DIR"/${BACKUP_PREFIX}_custom_*.backup | tail -n +6 | xargs -r rm -f
        
        # Remove corresponding SQL and metadata files
        ls -1t "$BACKUP_DIR"/${BACKUP_PREFIX}_sql_*.sql | tail -n +6 | xargs -r rm -f
        ls -1t "$BACKUP_DIR"/${BACKUP_PREFIX}_data_*.sql | tail -n +6 | xargs -r rm -f
        ls -1t "$BACKUP_DIR"/${BACKUP_PREFIX}_critical_*.sql | tail -n +6 | xargs -r rm -f
        ls -1t "$BACKUP_DIR"/${BACKUP_PREFIX}_metadata_*.txt | tail -n +6 | xargs -r rm -f
        
        local remaining_count=$(ls -1 "$BACKUP_DIR"/${BACKUP_PREFIX}_custom_*.backup 2>/dev/null | wc -l)
        print_status "Old backups cleaned up (kept latest 5, removed $((backup_count - remaining_count)) old backups)"
    else
        print_status "No cleanup needed ($backup_count backups found, keeping all - under limit of 5)"
    fi
}

# Main backup function
main_backup() {
    local backup_type=${1:-"full"}
    
    print_header "Database Backup - Type: $backup_type"
    
    # Create backup directory
    create_backup_dir
    
    # Check database connectivity
    if ! check_database; then
        exit 1
    fi
    
    # Show database stats
    get_database_stats
    
    case "$backup_type" in
        "full")
            print_status "Creating full backup (custom + SQL + data + critical)..."
            create_custom_backup
            create_sql_backup
            create_data_backup
            backup_critical_tables
            create_backup_metadata
            ;;
        "custom")
            create_custom_backup
            create_backup_metadata
            ;;
        "sql")
            create_sql_backup
            create_backup_metadata
            ;;
        "data")
            create_data_backup
            create_backup_metadata
            ;;
        "critical")
            backup_critical_tables
            create_backup_metadata
            ;;
        *)
            print_error "Unknown backup type: $backup_type"
            print_status "Available types: full, custom, sql, data, critical"
            exit 1
            ;;
    esac
    
    # Cleanup old backups
    cleanup_old_backups
    
    print_header "Backup Completed Successfully"
    print_status "Backup files are stored in: $BACKUP_DIR"
    print_status "To restore: ./scripts/restore_database.sh <backup_file>"
}

# Handle command line arguments
case "$1" in
    "full"|"custom"|"sql"|"data"|"critical")
        main_backup "$1"
        ;;
    "")
        main_backup "full"
        ;;
    *)
        echo "Usage: $0 [full|custom|sql|data|critical]"
        echo ""
        echo "Backup types:"
        echo "  full     - Complete backup (custom + SQL + data + critical tables)"
        echo "  custom   - PostgreSQL custom format (recommended for restore)"
        echo "  sql      - Plain SQL dump with schema"
        echo "  data     - Data-only backup"
        echo "  critical - Backup of critical tables only"
        exit 1
        ;;
esac