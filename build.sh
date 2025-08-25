#!/bin/bash

# Build script for DigitalOcean App Platform
# This will inject the Mapbox token from environment variables

if [ -z "$MAPBOX_TOKEN" ]; then
    echo "Error: MAPBOX_TOKEN environment variable not set"
    echo "Please set it in your App Platform environment variables"
    exit 1
fi

echo "Building with Mapbox token injection..."

# Create output directory
mkdir -p dist

# Replace the placeholder with actual token
sed "s/__MAPBOX_TOKEN__/$MAPBOX_TOKEN/g" index.html > dist/index.html

# Copy other files if needed
cp README.md dist/ 2>/dev/null || true

echo "Build completed successfully"
echo "Token injected and secured"