#!/bin/bash

# ReviewInn Mobile Development Script
# Quick script to run and hot-reload the app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/home/hasan181/personal/my_project/reviewinn_project/reviewinn-mobile"

# Navigate to project directory
cd "$PROJECT_DIR"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓ ${NC}$1"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

print_error() {
    echo -e "${RED}✗ ${NC}$1"
}

print_header() {
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check if Flutter web server is running
is_flutter_running() {
    if pgrep -f "flutter run.*web-server" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to show hot reload instructions
hot_reload() {
    print_header "Hot Reload Instructions"
    echo ""

    if is_flutter_running; then
        print_success "Flutter is running!"
        echo ""
        print_info "To hot reload your changes:"
        echo "  1. Go to the terminal where Flutter is running"
        echo "  2. Press 'r' (lowercase) and hit Enter"
        echo "  3. Changes will appear in 1-2 seconds!"
        echo ""
        print_info "Your app is at: ${CYAN}http://localhost:8085${NC}"
    else
        print_error "Flutter is not running"
        echo ""
        print_info "Start Flutter first:"
        echo "  ./run-dev.sh web"
    fi
}

# Function to show hot restart instructions
hot_restart() {
    print_header "Hot Restart Instructions"
    echo ""

    if is_flutter_running; then
        print_success "Flutter is running!"
        echo ""
        print_info "To hot restart your app:"
        echo "  1. Go to the terminal where Flutter is running"
        echo "  2. Press 'R' (capital R) and hit Enter"
        echo "  3. App will restart in 5-10 seconds"
        echo ""
        print_warning "Hot restart resets app state!"
        print_info "Use hot reload (r) when possible - it's faster"
    else
        print_error "Flutter is not running"
        echo ""
        print_info "Start Flutter first:"
        echo "  ./run-dev.sh web"
    fi
}

# Function to start Flutter web server
start_web() {
    print_info "Starting Flutter web server..."
    echo ""

    # Check if port 8085 is in use
    if lsof -Pi :8085 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "Port 8085 is already in use!"
        print_info "Stopping existing process..."

        # Kill process using port 8085
        lsof -ti:8085 | xargs kill -9 2>/dev/null || true

        # Also kill any Flutter processes
        pkill -9 -f "flutter run" 2>/dev/null || true

        sleep 2
        print_success "Port 8085 is now free"
        echo ""
    else
        # Still kill any stray Flutter processes
        pkill -f "flutter run" 2>/dev/null || true
    fi

    print_info "Server will start on http://localhost:8085"
    print_info "Press Ctrl+C to stop the server"
    echo ""

    flutter run -d web-server --web-port 8085 --web-hostname 0.0.0.0
}

# Function to start Flutter on Chrome
start_chrome() {
    print_info "Starting Flutter on Chrome..."
    echo ""

    # Kill any existing Flutter processes
    if pgrep -f "flutter run" > /dev/null; then
        print_warning "Stopping existing Flutter processes..."
        pkill -9 -f "flutter run" 2>/dev/null || true
        sleep 1
        print_success "Existing processes stopped"
        echo ""
    fi

    print_info "Chrome will open automatically"
    print_info "Press Ctrl+C to stop"
    echo ""

    flutter run -d chrome
}

# Function to stop all Flutter processes
stop_all() {
    print_header "Stopping All Flutter Processes"
    echo ""

    if pgrep -f "flutter run" > /dev/null; then
        print_info "Found running Flutter processes"
        pkill -9 -f "flutter run" 2>/dev/null || true
        sleep 1
        print_success "All Flutter processes stopped"
    else
        print_info "No Flutter processes running"
    fi

    # Also free up port 8085 if in use
    if lsof -Pi :8085 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_info "Freeing up port 8085..."
        lsof -ti:8085 | xargs kill -9 2>/dev/null || true
        sleep 1
        print_success "Port 8085 is now free"
    fi
}

# Function to build APK
build_apk() {
    print_info "Building APK (release mode)..."

    flutter build apk --release

    APK_PATH="build/app/outputs/flutter-apk/app-release.apk"
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)

    print_success "APK built successfully!"
    print_info "Location: $APK_PATH"
    print_info "Size: $APK_SIZE"
}

# Function to clean and get dependencies
clean_build() {
    print_info "Cleaning build artifacts..."
    flutter clean

    print_info "Getting dependencies..."
    flutter pub get

    print_success "Clean build completed!"
}

# Main menu
show_menu() {
    clear
    print_header "ReviewInn Mobile - Development Menu"
    echo ""
    echo "  ${CYAN}1${NC}) Hot Reload Instructions (press 'r' in Flutter terminal)"
    echo "  ${CYAN}2${NC}) Hot Restart Instructions (press 'R' in Flutter terminal)"
    echo "  ${CYAN}3${NC}) Start Web Server (http://localhost:8085)"
    echo "  ${CYAN}4${NC}) Start on Chrome"
    echo "  ${CYAN}5${NC}) Build APK (release)"
    echo "  ${CYAN}6${NC}) Clean & Get Dependencies"
    echo "  ${CYAN}7${NC}) Check Flutter Status"
    echo "  ${CYAN}8${NC}) Open Browser (http://localhost:8085)"
    echo "  ${CYAN}q${NC}) Quit"
    echo ""

    # Show Flutter status
    if is_flutter_running; then
        print_success "Flutter web server is running"
    else
        print_warning "Flutter web server is not running"
    fi

    echo ""
    read -p "Choose an option: " choice

    case $choice in
        1)
            hot_reload
            read -p "Press Enter to continue..."
            show_menu
            ;;
        2)
            hot_restart
            read -p "Press Enter to continue..."
            show_menu
            ;;
        3)
            start_web
            ;;
        4)
            start_chrome
            ;;
        5)
            build_apk
            read -p "Press Enter to continue..."
            show_menu
            ;;
        6)
            clean_build
            read -p "Press Enter to continue..."
            show_menu
            ;;
        7)
            print_info "Checking Flutter status..."
            flutter doctor -v
            read -p "Press Enter to continue..."
            show_menu
            ;;
        8)
            print_info "Opening browser..."
            xdg-open http://localhost:8085 2>/dev/null || {
                print_warning "Could not open browser automatically"
                print_info "Please visit: http://localhost:8085"
            }
            read -p "Press Enter to continue..."
            show_menu
            ;;
        q|Q)
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            sleep 1
            show_menu
            ;;
    esac
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    # No arguments, show menu
    show_menu
else
    case "$1" in
        reload|r)
            hot_reload
            ;;
        restart|R)
            hot_restart
            ;;
        web|w)
            start_web
            ;;
        chrome|c)
            start_chrome
            ;;
        apk|build|b)
            build_apk
            ;;
        clean)
            clean_build
            ;;
        stop|s)
            stop_all
            ;;
        open|o)
            xdg-open http://localhost:8085 2>/dev/null || {
                print_info "Please visit: http://localhost:8085"
            }
            ;;
        help|h|-h|--help)
            print_header "ReviewInn Mobile - Help"
            echo ""
            echo "Usage: ./run-dev.sh [command]"
            echo ""
            echo "Commands:"
            echo "  reload, r       - Show hot reload instructions"
            echo "  restart, R      - Show hot restart instructions"
            echo "  web, w          - Start web server"
            echo "  chrome, c       - Start on Chrome"
            echo "  apk, build, b   - Build APK"
            echo "  clean           - Clean and get dependencies"
            echo "  stop, s         - Stop all Flutter processes and free port 8085"
            echo "  open, o         - Open browser"
            echo "  help, h         - Show this help"
            echo ""
            echo "No arguments: Show interactive menu"
            ;;
        *)
            print_error "Unknown command: $1"
            print_info "Run './run-dev.sh help' for usage"
            exit 1
            ;;
    esac
fi
