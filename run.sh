#!/bin/bash

# ReviewInn Project Manager with Intelligent Database Backup System
# This script manages the full ReviewInn application stack with comprehensive backup protection

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project Configuration
PROJECT_NAME="ReviewInn"
DB_NAME="reviewinn_db"
DB_USER="reviewinn_user"
DB_PASSWORD="Munna1992"
DB_HOST="localhost"
DB_PORT="5432"

# Backup Configuration
BACKUP_DIR="$(pwd)/backups"
SCRIPTS_DIR="$(pwd)/scripts"
MAX_RECENT_BACKUPS=3
MAX_DAILY_BACKUPS=7
MAX_WEEKLY_BACKUPS=4

# Docker Compose Configuration
DOCKER_COMPOSE=""

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    # Check for the new docker-compose first (installed via fix-docker.sh)
    if [ -f "$HOME/.local/bin/docker-compose" ]; then
        export PATH="$HOME/.local/bin:$PATH"
        DOCKER_COMPOSE="$HOME/.local/bin/docker-compose"
        return 0
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    # Use docker-compose if available, otherwise use docker compose
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        DOCKER_COMPOSE="docker compose"
    fi
}

# Function to check if PostgreSQL is running
check_postgres() {
    if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME >/dev/null 2>&1; then
        return 1
    fi
    return 0
}

# Function to wait for PostgreSQL
wait_for_postgres() {
    info "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if check_postgres; then
            log "PostgreSQL is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    
    error "PostgreSQL failed to start within expected time"
    return 1
}

# Function to create database backup with intelligent naming
create_backup() {
    local backup_type="$1"  # recent, daily, weekly
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local date_only=$(date '+%Y%m%d')
    local backup_file=""
    
    case $backup_type in
        "recent")
            backup_file="$BACKUP_DIR/reviewinn_recent_${timestamp}.backup"
            ;;
        "daily")
            backup_file="$BACKUP_DIR/reviewinn_daily_${date_only}.backup"
            ;;
        "weekly")
            local week_num=$(date '+%Y_W%U')
            backup_file="$BACKUP_DIR/reviewinn_weekly_${week_num}.backup"
            ;;
        *)
            backup_file="$BACKUP_DIR/reviewinn_backup_${timestamp}.backup"
            ;;
    esac
    
    info "Creating $backup_type backup: $(basename $backup_file)"
    
    # Create backup with metadata
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -Fc -f "$backup_file" >/dev/null 2>&1; then
        # Create metadata file
        local metadata_file="${backup_file%.backup}.meta"
        cat > "$metadata_file" << EOF
Backup Type: $backup_type
Database: $DB_NAME
User: $DB_USER
Host: $DB_HOST:$DB_PORT
Created: $(date '+%Y-%m-%d %H:%M:%S')
Size: $(du -h "$backup_file" | cut -f1)
Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git branch --show-current 2>/dev/null || echo "N/A")
Docker Status: $(docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null | grep -E "(reviewinn|db)" | head -3 | tr '\n' ' ' || echo "N/A")
EOF
        
        log "$backup_type backup created successfully: $(basename $backup_file) ($(du -h "$backup_file" | cut -f1))"
        return 0
    else
        error "Failed to create $backup_type backup"
        return 1
    fi
}

# Function to clean up old backups based on retention policy
cleanup_backups() {
    info "Cleaning up old backups..."
    
    # Clean up recent backups (keep last 3)
    ls -t "$BACKUP_DIR"/reviewinn_recent_*.backup 2>/dev/null | tail -n +$((MAX_RECENT_BACKUPS + 1)) | while read -r backup; do
        if [ -f "$backup" ]; then
            rm -f "$backup" "${backup%.backup}.meta"
            info "Removed old recent backup: $(basename $backup)"
        fi
    done
    
    # Clean up daily backups (keep last 7 days)
    find "$BACKUP_DIR" -name "reviewinn_daily_*.backup" -mtime +$MAX_DAILY_BACKUPS -exec rm -f {} \; -exec rm -f {}.meta \; 2>/dev/null || true
    
    # Clean up weekly backups (keep last 4 weeks)
    find "$BACKUP_DIR" -name "reviewinn_weekly_*.backup" -mtime +$((MAX_WEEKLY_BACKUPS * 7)) -exec rm -f {} \; -exec rm -f {}.meta \; 2>/dev/null || true
    
    log "Backup cleanup completed"
}

# Function to create intelligent backups
intelligent_backup() {
    info "Starting intelligent backup process..."
    
    if ! check_postgres; then
        warn "PostgreSQL not available, skipping backup"
        return 1
    fi
    
    local current_hour=$(date '+%H')
    local current_day=$(date '+%u')  # 1=Monday, 7=Sunday
    local today=$(date '+%Y%m%d')
    
    # Always create recent backup
    create_backup "recent"
    
    # Create daily backup if it's the first backup of the day
    if [ ! -f "$BACKUP_DIR/reviewinn_daily_${today}.backup" ]; then
        create_backup "daily"
    fi
    
    # Create weekly backup on Sundays (day 7) or if no weekly backup exists for this week
    local week_num=$(date '+%Y_W%U')
    if [ "$current_day" -eq 7 ] || [ ! -f "$BACKUP_DIR/reviewinn_weekly_${week_num}.backup" ]; then
        create_backup "weekly"
    fi
    
    # Clean up old backups
    cleanup_backups
}

# Function to list available backups
list_backups() {
    echo -e "\n${BLUE}=== Available Database Backups ===${NC}"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        warn "No backups found in $BACKUP_DIR"
        return 0
    fi
    
    echo -e "\n${YELLOW}Recent Backups (Last $MAX_RECENT_BACKUPS):${NC}"
    ls -la "$BACKUP_DIR"/reviewinn_recent_*.backup 2>/dev/null | tail -n $MAX_RECENT_BACKUPS || echo "  No recent backups found"
    
    echo -e "\n${YELLOW}Daily Backups (Last $MAX_DAILY_BACKUPS days):${NC}"
    ls -la "$BACKUP_DIR"/reviewinn_daily_*.backup 2>/dev/null | tail -n $MAX_DAILY_BACKUPS || echo "  No daily backups found"
    
    echo -e "\n${YELLOW}Weekly Backups (Last $MAX_WEEKLY_BACKUPS weeks):${NC}"
    ls -la "$BACKUP_DIR"/reviewinn_weekly_*.backup 2>/dev/null | tail -n $MAX_WEEKLY_BACKUPS || echo "  No weekly backups found"
    
    echo -e "\n${BLUE}Total backup size: $(du -sh $BACKUP_DIR 2>/dev/null | cut -f1 || echo 'Unknown')${NC}"
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file to restore from"
        list_backups
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        # Try to find backup in backup directory
        if [ -f "$BACKUP_DIR/$backup_file" ]; then
            backup_file="$BACKUP_DIR/$backup_file"
        else
            error "Backup file not found: $backup_file"
            list_backups
            return 1
        fi
    fi
    
    warn "This will COMPLETELY REPLACE the current database with the backup!"
    echo -n "Are you sure you want to continue? (yes/no): "
    read -r confirmation
    
    if [ "$confirmation" != "yes" ]; then
        info "Restore cancelled by user"
        return 0
    fi
    
    info "Creating safety backup before restore..."
    create_backup "recent"
    
    info "Restoring database from: $(basename $backup_file)"
    
    # Drop and recreate database
    PGPASSWORD="$DB_PASSWORD" dropdb -h $DB_HOST -U $DB_USER $DB_NAME --if-exists
    PGPASSWORD="$DB_PASSWORD" createdb -h $DB_HOST -U $DB_USER $DB_NAME
    
    # Restore backup
    if PGPASSWORD="$DB_PASSWORD" pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -v "$backup_file"; then
        log "Database restored successfully from: $(basename $backup_file)"
        
        # Show metadata if available
        local metadata_file="${backup_file%.backup}.meta"
        if [ -f "$metadata_file" ]; then
            echo -e "\n${BLUE}Backup Metadata:${NC}"
            cat "$metadata_file"
        fi
    else
        error "Failed to restore database from backup"
        return 1
    fi
}

# Function to backup database safely (with timeout)
backup_database_safe() {
    info "Creating automatic backup before operation..."
    
    # Try to create backup, but don't fail if it doesn't work
    if timeout 60 intelligent_backup 2>/dev/null; then
        log "✅ Database backup completed successfully"
    else
        warn "⚠️  Database backup failed or timed out, but continuing with operation"
        warn "   Database may not be running, starting up, or unreachable"
        warn "   This is normal if services are currently stopped"
    fi
}

# Function to start the application
start_services() {
    print_header "Starting $PROJECT_NAME Services"
    check_docker
    check_docker_compose
    
    info "Starting Docker containers..."
    $DOCKER_COMPOSE up -d --build
    
    info "Waiting for services to be ready..."
    sleep 10
    
    # Wait for PostgreSQL and create backup
    if wait_for_postgres; then
        intelligent_backup
    fi
    
    log "$PROJECT_NAME services started successfully!"
    echo -e "${GREEN}Frontend: http://localhost:5173${NC}"
    echo -e "${GREEN}Backend API: http://localhost:8000${NC}"
    echo -e "${GREEN}Admin Panel: http://localhost:8001${NC}"
    echo -e "${BLUE}Database: localhost:5432${NC}"
    echo -e "${BLUE}Use './run.sh logs' to view logs${NC}"
    echo -e "${BLUE}Use './run.sh status' to check service status${NC}"
}

# Function to stop services
stop_services() {
    print_header "Stopping $PROJECT_NAME Services"
    check_docker_compose
    
    # Create backup before stopping
    backup_database_safe
    
    info "Stopping all Docker containers..."
    $DOCKER_COMPOSE down
    
    info "Removing any orphaned containers..."
    $DOCKER_COMPOSE down --remove-orphans
    
    info "Cleaning up any remaining containers..."
    docker ps -q --filter "name=reviewinn" | xargs -r docker stop 2>/dev/null || true
    docker ps -aq --filter "name=reviewinn" | xargs -r docker rm 2>/dev/null || true
    
    log "$PROJECT_NAME services stopped successfully!"
}

# Function to restart services
restart_services() {
    print_header "Restarting $PROJECT_NAME Services (No Cache)"
    check_docker_compose
    
    # Create backup before restart
    backup_database_safe
    
    info "Stopping all Docker containers..."
    $DOCKER_COMPOSE down
    
    info "Removing any orphaned containers..."
    $DOCKER_COMPOSE down --remove-orphans
    
    info "Cleaning up any remaining containers..."
    docker ps -q --filter "name=reviewinn" | xargs -r docker stop 2>/dev/null || true
    docker ps -aq --filter "name=reviewinn" | xargs -r docker rm 2>/dev/null || true
    
    info "Removing Docker images to clear cache..."
    docker images --filter "reference=reviewinn*" -q | xargs -r docker rmi -f 2>/dev/null || true
    
    info "Rebuilding and starting services without cache..."
    $DOCKER_COMPOSE up -d --build --force-recreate --no-deps
    
    info "Waiting for services to be ready..."
    sleep 10
    
    # Wait for PostgreSQL and create backup
    if wait_for_postgres; then
        intelligent_backup
    fi
    
    log "$PROJECT_NAME services restarted successfully (without cache)!"
    echo -e "${GREEN}Frontend: http://localhost:5173${NC}"
    echo -e "${GREEN}Backend API: http://localhost:8000${NC}"
    echo -e "${GREEN}Admin Panel: http://localhost:8001${NC}"
    echo -e "${BLUE}Database: localhost:5432${NC}"
    echo -e "${BLUE}Use './run.sh logs' to view logs${NC}"
    echo -e "${BLUE}Use './run.sh status' to check service status${NC}"
}

# Function to rebuild services
rebuild_services() {
    print_header "Rebuilding $PROJECT_NAME Services"
    check_docker_compose
    
    # Create backup before rebuild
    backup_database_safe
    
    info "Stopping services..."
    $DOCKER_COMPOSE down
    
    info "Rebuilding all services..."
    $DOCKER_COMPOSE build --no-cache
    
    info "Starting services..."
    $DOCKER_COMPOSE up -d
    
    # Wait for PostgreSQL
    wait_for_postgres
    
    log "Services rebuilt and started successfully!"
}

# Function to show logs
show_logs() {
    check_docker_compose
    
    if [ -n "$2" ]; then
        print_header "Showing logs for service: $2"
        $DOCKER_COMPOSE logs -f "$2"
    else
        print_header "Showing logs for all services"
        $DOCKER_COMPOSE logs -f
    fi
}

# Function to show status
show_status() {
    print_header "$PROJECT_NAME Service Status"
    check_docker_compose
    
    echo -e "\n${YELLOW}Docker Containers:${NC}"
    $DOCKER_COMPOSE ps
    
    echo -e "\n${YELLOW}Database Connection:${NC}"
    if check_postgres; then
        echo -e "${GREEN}✓ PostgreSQL is running and accessible${NC}"
    else
        echo -e "${RED}✗ PostgreSQL is not accessible${NC}"
    fi
    
    echo -e "\n${YELLOW}Service Health:${NC}"
    # Check if services are responding
    
    # Check backend
    if curl -s http://localhost:8000/docs >/dev/null 2>&1; then
        echo -e "Backend API: ${GREEN}✓ Running${NC} (http://localhost:8000)"
    else
        echo -e "Backend API: ${RED}✗ Not responding${NC}"
    fi
    
    # Check frontend
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo -e "Frontend: ${GREEN}✓ Running${NC} (http://localhost:5173)"
    else
        echo -e "Frontend: ${RED}✗ Not responding${NC}"
    fi
    
    # Check admin
    if curl -s http://localhost:8001 >/dev/null 2>&1; then
        echo -e "Admin Panel: ${GREEN}✓ Running${NC} (http://localhost:8001)"
    else
        echo -e "Admin Panel: ${RED}✗ Not responding${NC}"
    fi
    
    echo -e "\n${YELLOW}Recent Backups:${NC}"
    ls -la "$BACKUP_DIR"/reviewinn_recent_*.backup 2>/dev/null | tail -n 3 || echo "  No recent backups found"
}

# Function to clean up Docker resources
clean_services() {
    print_header "Cleaning Up Docker Resources"
    check_docker_compose
    
    warn "This will remove all containers, networks, and unused images."
    echo -n "Are you sure? (y/N): "
    read -r -n 1 reply
    echo
    
    if [[ $reply =~ ^[Yy]$ ]]; then
        # Create backup before cleanup
        backup_database_safe
        
        info "Stopping services..."
        $DOCKER_COMPOSE down
        
        info "Removing containers and networks..."
        $DOCKER_COMPOSE down --volumes --remove-orphans
        
        info "Cleaning up unused Docker resources..."
        docker system prune -f
        
        log "Cleanup completed!"
    else
        info "Cleanup cancelled."
    fi
}

# Function for development mode
dev_mode() {
    print_header "Starting Development Mode"
    check_docker_compose
    
    # Create backup before starting dev mode
    backup_database_safe
    
    info "Starting services in development mode with live reload..."
    $DOCKER_COMPOSE up --build
}

# Function for production mode
prod_mode() {
    print_header "Starting Production Mode"
    check_docker_compose
    
    # Create backup before starting production mode
    backup_database_safe
    
    info "Starting services in production mode..."
    $DOCKER_COMPOSE -f docker-compose.yml up -d --build
}

# Function to reset database
reset_database() {
    warn "This will completely reset the database!"
    echo -n "Are you sure? (yes/no): "
    read -r confirmation
    if [ "$confirmation" = "yes" ]; then
        # Create backup before reset
        intelligent_backup
        $DOCKER_COMPOSE down
        $DOCKER_COMPOSE up -d db
        wait_for_postgres
        cd reviewinn-backend
        python create_tables.py
        cd ..
        log "Database reset completed"
    else
        info "Database reset cancelled"
    fi
}

# Function to update dependencies
update_dependencies() {
    info "Updating dependencies..."
    
    # Create backup before updates
    backup_database_safe
    
    cd reviewinn-frontend && npm update && cd ..
    cd reviewinn-backend && source venv/bin/activate && pip install -r requirements.txt --upgrade && cd ..
    log "Dependencies updated"
}

# Function to show help
show_help() {
    echo -e "\n${BLUE}=== $PROJECT_NAME Manager with Intelligent Backup System ===${NC}"
    echo -e "${GREEN}Usage: $0 [COMMAND] [OPTIONS]${NC}"
    echo ""
    echo -e "${YELLOW}Service Management:${NC}"
    echo "  start          Start all services (with automatic backup)"
    echo "  stop           Stop all Docker containers completely (with backup)"
    echo "  restart        Stop containers & restart WITHOUT cache (with backup)"
    echo "  rebuild        Rebuild and restart services (with automatic backup)"
    echo "  status         Show service status and health"
    echo "  logs [service] Show logs (backend|frontend|db|admin|all)"
    echo "  clean          Clean up Docker resources (with backup)"
    echo "  dev            Start in development mode (with backup)"
    echo "  prod           Start in production mode (with backup)"
    echo ""
    echo -e "${YELLOW}Intelligent Backup System:${NC}"
    echo "  backup                Create intelligent backup (recent + daily/weekly as needed)"
    echo "  backup-recent         Create recent backup only"
    echo "  backup-daily          Create daily backup"
    echo "  backup-weekly         Create weekly backup"
    echo "  list-backups          List all available backups"
    echo "  restore <file>        Restore database from backup file"
    echo "  cleanup-backups       Clean up old backups manually"
    echo ""
    echo -e "${YELLOW}Database Management:${NC}"
    echo "  reset-db              Reset database (with backup)"
    echo "  update                Update dependencies (with backup)"
    echo ""
    echo -e "${BLUE}Backup Retention Policy:${NC}"
    echo "  • Recent: Last $MAX_RECENT_BACKUPS backups (created on every operation)"
    echo "  • Daily: Last $MAX_DAILY_BACKUPS days (one backup per day)"
    echo "  • Weekly: Last $MAX_WEEKLY_BACKUPS weeks (one backup per week, created on Sundays)"
    echo "  • Automatic cleanup removes old backups beyond retention limits"
    echo ""
    echo -e "${BLUE}Safety Features:${NC}"
    echo "  • Automatic backup before all destructive operations"
    echo "  • Safety backup before restore operations"
    echo "  • Metadata tracking (Git commit, timestamps, sizes)"
    echo "  • Graceful timeout handling for backup operations"
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo "  Frontend:    http://localhost:5173"
    echo "  Backend API: http://localhost:8000"
    echo "  Admin Panel: http://localhost:8001"
    echo "  Database:    localhost:5432"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 start                         # Start services with backup"
    echo "  $0 stop                          # Stop all containers completely"
    echo "  $0 restart                       # Restart without cache (fresh build)"
    echo "  $0 backup                        # Create intelligent backup"
    echo "  $0 list-backups                  # Show all backups"
    echo "  $0 restore recent_backup         # Restore from backup"
    echo "  $0 logs backend                  # Show backend logs"
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    rebuild)
        rebuild_services
        ;;
    logs)
        show_logs "$@"
        ;;
    status)
        show_status
        ;;
    clean)
        clean_services
        ;;
    dev)
        dev_mode
        ;;
    prod)
        prod_mode
        ;;
    backup)
        intelligent_backup
        ;;
    backup-recent)
        create_backup "recent"
        ;;
    backup-daily)
        create_backup "daily"
        ;;
    backup-weekly)
        create_backup "weekly"
        ;;
    list-backups|backups)
        list_backups
        ;;
    restore)
        restore_backup "$2"
        ;;
    cleanup-backups)
        cleanup_backups
        ;;
    reset-db)
        reset_database
        ;;
    update)
        update_dependencies
        ;;
    help|--help|-h|*)
        show_help
        ;;
esac