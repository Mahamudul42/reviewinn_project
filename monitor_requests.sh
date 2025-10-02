#!/bin/bash

# Real-time monitoring of what requests are hitting your system

echo "=== Real-Time Request Monitor ==="
echo "This will show you live requests as they happen"
echo "Open your browser and try to create a group now..."
echo "Press Ctrl+C to stop"
echo ""
echo "Watching for requests..."
echo ""

docker logs -f reviewinn_frontend 2>&1 | grep --line-buffered -E "(Sending Request|Received Response|proxy error)"
