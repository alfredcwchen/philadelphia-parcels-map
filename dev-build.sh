#!/bin/bash

# Local development build script
# This loads environment variables from .env file

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found"
    echo "Please create a .env file with MAPBOX_TOKEN=your_token_here"
    exit 1
fi

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Check if MAPBOX_TOKEN is set
if [ -z "$MAPBOX_TOKEN" ]; then
    echo "Error: MAPBOX_TOKEN not found in .env file"
    echo "Please add MAPBOX_TOKEN=your_token_here to your .env file"
    exit 1
fi

echo "Building for local development with token from .env..."

# Create output directory
mkdir -p dev-dist

# Replace the placeholder with actual token
sed "s/__MAPBOX_TOKEN__/$MAPBOX_TOKEN/g" index.html > dev-dist/index.html

# Copy other files if needed
cp README.md dev-dist/ 2>/dev/null || true

echo "Local build completed successfully"
echo "Token loaded from .env file"
echo ""
echo "To serve locally:"
echo "  cd dev-dist"
echo "  python -m http.server 8000"
echo "  # or"
echo "  npx serve ."