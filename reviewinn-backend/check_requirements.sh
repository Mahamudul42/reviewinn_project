#!/bin/bash

# Function to check pip package requirements
check_requirements() {
    local req_file=$1
    local error_count=0
    
    echo "Validating packages in $req_file..."
    
    # Read each line from requirements file
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip comments and empty lines
        if [[ $line =~ ^[[:space:]]*$ || $line =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # Extract package name and version
        if [[ $line =~ ^([a-zA-Z0-9_.-]+)([=<>]+)([0-9.]+) ]]; then
            package=${BASH_REMATCH[1]}
            version_constraint=${BASH_REMATCH[2]}
            version=${BASH_REMATCH[3]}
            
            # Check if package exists with this version
            if ! pip index versions $package | grep -q "$version"; then
                echo "⚠️  WARNING: Package $package version $version not found in PyPI"
                echo "   Available versions: $(pip index versions $package | head -3)"
                error_count=$((error_count + 1))
            fi
        fi
    done < "$req_file"
    
    if [ $error_count -gt 0 ]; then
        echo "❌ Found $error_count potential package issues"
        return 1
    else
        echo "✅ All packages appear valid"
        return 0
    fi
}

# Main entry point
if [[ "$1" == "--check" ]]; then
    check_requirements "$2"
    exit $?
fi

echo "Usage: $0 --check requirements.txt"
exit 1
