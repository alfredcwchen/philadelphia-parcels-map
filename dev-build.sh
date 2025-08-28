#!/bin/bash

# Local development build script
# This loads environment variables from .env file

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found"
    echo "Please create a .env file with MAPBOX_ACCESS_TOKEN=your_token_here"
    exit 1
fi

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Check if MAPBOX_ACCESS_TOKEN is set
if [ -z "$MAPBOX_ACCESS_TOKEN" ]; then
    echo "Error: MAPBOX_ACCESS_TOKEN not found in .env file"
    echo "Please add MAPBOX_ACCESS_TOKEN=your_token_here to your .env file"
    exit 1
fi

echo "Building for local development with token from .env..."

# Replace the placeholder with actual token and create index-dev.html
sed "s/{{MAPBOX_ACCESS_TOKEN}}/$MAPBOX_ACCESS_TOKEN/g" index.html > index-dev.html

echo "Local build completed successfully"
echo "Token loaded from .env file and injected into index-dev.html"
echo ""
echo "To serve locally:"
echo "  python -m http.server 8000"
echo "  # or"
echo "  npx serve ."
echo ""
echo "Then open: http://localhost:8000/index-dev.html"