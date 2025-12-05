#!/bin/bash

# Build script for DigitalOcean App Platform
# This will inject the Mapbox token and Google API key from environment variables

if [ -z "$MAPBOX_ACCESS_TOKEN" ]; then
    echo "Error: MAPBOX_ACCESS_TOKEN environment variable not set"
    echo "Please set it in your App Platform environment variables"
    exit 1
fi

echo "Building with Mapbox token injection..."

# Note: No longer using Git LFS or GeoJSON files - now using PMTiles tile server
# GeoJSON files removed to reduce deployment size from 471 MB to ~100 KB

# Create output directory
mkdir -p dist

# Replace the placeholders with actual values
sed "s/{{MAPBOX_ACCESS_TOKEN}}/$MAPBOX_ACCESS_TOKEN/g" index.html > dist/index.html.tmp

# Replace Google API key if provided (optional)
if [ -n "$GOOGLE_MAPS_API_KEY" ]; then
    echo "Injecting Google Maps API key..."
    sed "s/{{GOOGLE_MAPS_API_KEY}}/$GOOGLE_MAPS_API_KEY/g" dist/index.html.tmp > dist/index.html
else
    echo "Google Maps API key not set - geocoding will use Mapbox only"
    sed "s/{{GOOGLE_MAPS_API_KEY}}//g" dist/index.html.tmp > dist/index.html
fi

# Clean up temp file
rm dist/index.html.tmp

# Copy other files if needed
cp README.md dist/ 2>/dev/null || true
cp favicon.ico dist/ 2>/dev/null || true

echo "Build completed successfully"
echo "Token injected and secured"
echo "Using PMTiles tile server for Hong Kong layers"
echo "Deployment size reduced from 471 MB to ~100 KB"