#!/bin/bash

# ReviewInn Mobile - Quick Run Script
# Run this to start your Flutter app in the browser

set -e

FLUTTER_BIN="$HOME/flutter/bin/flutter"
PORT=8080

echo "🚀 Starting ReviewInn Mobile App..."
echo ""

# Check if Flutter is installed
if [ ! -f "$FLUTTER_BIN" ]; then
    echo "❌ Flutter not found at $FLUTTER_BIN"
    exit 1
fi

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port $PORT is already in use!"
    echo ""
    echo "Options:"
    echo "1. Kill the existing process: lsof -ti:$PORT | xargs kill -9"
    echo "2. Use a different port: ./run.sh [port_number]"
    echo ""
    echo "To view the running app, open: http://localhost:$PORT"
    exit 1
fi

# Use custom port if provided
if [ ! -z "$1" ]; then
    PORT=$1
    echo "Using custom port: $PORT"
fi

echo "📱 App will be available at: http://localhost:$PORT"
echo ""
echo "💡 Tips:"
echo "  - Press 'r' to hot reload"
echo "  - Press 'R' to hot restart"
echo "  - Press 'q' to quit"
echo ""
echo "Opening app..."
echo ""

# Set Chrome executable and run
CHROME_EXECUTABLE=/usr/bin/chromium-browser $FLUTTER_BIN run -d web-server --web-port=$PORT
