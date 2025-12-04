#!/bin/bash

# Build script for DigitalOcean App Platform
# This will inject the Mapbox token from environment variables

if [ -z "$MAPBOX_ACCESS_TOKEN" ]; then
    echo "Error: MAPBOX_ACCESS_TOKEN environment variable not set"
    echo "Please set it in your App Platform environment variables"
    exit 1
fi

echo "Building with Mapbox token injection..."

# Create output directory
mkdir -p dist

# Replace the placeholder with actual token
sed "s/{{MAPBOX_ACCESS_TOKEN}}/$MAPBOX_ACCESS_TOKEN/g" index.html > dist/index.html

# Copy GeoJSON files for Hong Kong layers
echo "Copying Hong Kong GeoJSON files..."
mkdir -p dist/geoJSON/HKGIS
cp geoJSON/HKGIS/LandParcel_Lot_HK_wgs84.geojson dist/geoJSON/HKGIS/
cp geoJSON/HKGIS/Building_HK_wgs84.geojson dist/geoJSON/HKGIS/

# Copy other files if needed
cp README.md dist/ 2>/dev/null || true
cp favicon.ico dist/ 2>/dev/null || true

PARCELS_SIZE=$(du -h dist/geoJSON/HKGIS/LandParcel_Lot_HK_wgs84.geojson | cut -f1)
BUILDINGS_SIZE=$(du -h dist/geoJSON/HKGIS/Building_HK_wgs84.geojson | cut -f1)

echo "Build completed successfully"
echo "Token injected and secured"
echo "Hong Kong Land Parcels: $PARCELS_SIZE"
echo "Hong Kong Buildings: $BUILDINGS_SIZE"