#!/bin/bash

# ReviewInn Development Management Script
# Manages development and production services

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

show_status() {
    echo -e "${BLUE}🔍 Current Service Status:${NC}"
    echo "================================"
    
    # Check frontend
    if ss -tulpn | grep -q ':5173'; then
        echo -e "${GREEN}✅ Frontend Dev Server (5173): Running${NC}"
    else
        echo -e "${RED}❌ Frontend Dev Server (5173): Stopped${NC}"
    fi
    
    # Check backend
    if ss -tulpn | grep -q ':8000'; then
        echo -e "${GREEN}✅ Backend API (8000): Running${NC}"
    else
        echo -e "${RED}❌ Backend API (8000): Stopped${NC}"
    fi
    
    # Check nginx
    if ss -tulpn | grep -q ':80'; then
        echo -e "${GREEN}✅ Nginx Proxy (80): Running${NC}"
    else
        echo -e "${RED}❌ Nginx Proxy (80): Stopped${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo "   Development: http://localhost:5173"
    echo "   Public: http://cs-u-jamjar.cs.umn.edu"
    echo "   Domain: http://reviewinn.com"
}

start_dev() {
    echo -e "${YELLOW}🚀 Starting Development Environment...${NC}"
    
    # Start backend services
    echo "Starting backend services..."
    docker-compose up -d
    
    # Start frontend dev server in background
    echo "Starting frontend dev server..."
    cd reviewinn-frontend
    npm run dev &
    DEV_PID=$!
    echo $DEV_PID > ../dev-server.pid
    cd ..
    
    echo -e "${GREEN}✅ Development environment started${NC}"
    show_status
}

stop_dev() {
    echo -e "${YELLOW}🛑 Stopping Development Environment...${NC}"
    
    # Stop frontend dev server
    if [ -f "dev-server.pid" ]; then
        DEV_PID=$(cat dev-server.pid)
        if ps -p $DEV_PID > /dev/null; then
            kill $DEV_PID
            echo "Frontend dev server stopped"
        fi
        rm -f dev-server.pid
    fi
    
    # Stop backend services
    docker-compose down
    
    echo -e "${GREEN}✅ Development environment stopped${NC}"
}

restart_backend() {
    echo -e "${YELLOW}🔄 Restarting Backend Services...${NC}"
    
    # Quick restart (2-5 seconds downtime)
    docker-compose restart backend
    
    echo -e "${GREEN}✅ Backend restarted${NC}"
    show_status
}

rebuild_backend() {
    echo -e "${YELLOW}🔨 Rebuilding Backend Services...${NC}"
    
    # Rebuild (10-15 seconds downtime)
    docker-compose up --build -d backend
    
    echo -e "${GREEN}✅ Backend rebuilt${NC}"
    show_status
}

case "$1" in
    "status")
        show_status
        ;;
    "start")
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "restart-backend")
        restart_backend
        ;;
    "rebuild-backend")
        rebuild_backend
        ;;
    *)
        echo -e "${BLUE}ReviewInn Development Manager${NC}"
        echo "================================"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Commands:"
        echo "  status           - Show current service status"
        echo "  start           - Start full development environment"
        echo "  stop            - Stop all services"
        echo "  restart-backend - Quick backend restart (2-5s downtime)"
        echo "  rebuild-backend - Rebuild backend (10-15s downtime)"
        echo ""
        echo "Examples:"
        echo "  $0 status"
        echo "  $0 restart-backend"
        ;;
esac