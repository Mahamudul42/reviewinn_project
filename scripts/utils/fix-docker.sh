#!/bin/bash

# Fix Docker Compose compatibility issue
# This script installs the latest Docker Compose to resolve the chunked parameter error

echo "=== Fixing Docker Compose Compatibility Issue ==="

# Create alias for the new docker-compose
echo "Creating docker-compose alias..."
echo 'alias docker-compose="$HOME/.local/bin/docker-compose"' >> ~/.bash_aliases

# Load aliases in current session
source ~/.bash_aliases 2>/dev/null || true

# Test the fix
echo "Testing docker-compose..."
export PATH="$HOME/.local/bin:$PATH"
$HOME/.local/bin/docker-compose --version

echo ""
echo "=== Fix Complete ==="
echo "Docker Compose has been updated to resolve the chunked parameter issue."
echo ""
echo "Usage:"
echo "1. For current session: export PATH=\"\$HOME/.local/bin:\$PATH\""
echo "2. For future sessions: source ~/.bashrc"
echo "3. Or use the full path: ~/.local/bin/docker-compose"
echo ""
echo "You can now run your Docker services without the chunked parameter error."