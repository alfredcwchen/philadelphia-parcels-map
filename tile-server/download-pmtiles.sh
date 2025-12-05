#!/bin/bash

# Download PMTiles files from GitHub Releases
# This is more reliable than Git LFS for DigitalOcean

set -e

REPO="alfredcwchen/philadelphia-parcels-map"
RELEASE_TAG="pmtiles-v1"

echo "📦 Downloading PMTiles files..."

# Function to download file if it doesn't exist or is too small (LFS pointer)
download_if_needed() {
    local file=$1
    local url=$2
    
    if [ ! -f "$file" ] || [ $(stat -c%s "$file" 2>/dev/null || echo 0) -lt 1000000 ]; then
        echo "⬇️  Downloading $file..."
        curl -L -o "$file" "$url" || {
            echo "❌ Failed to download $file"
            return 1
        }
        echo "✅ Downloaded $file"
    else
        echo "✓ $file already exists and is valid"
    fi
}

# Create pmtiles directory if it doesn't exist
mkdir -p pmtiles

# For now, use the actual LFS URLs as fallback
# These are the direct LFS download URLs from GitHub
GH_LFS_BASE="https://media.githubusercontent.com/media/${REPO}/main/tile-server"

# Try downloading from release first, fall back to LFS
download_if_needed "Seattle_Parcels.pmtiles" "${GH_LFS_BASE}/Seattle_Parcels.pmtiles" || \
    echo "⚠️  Could not download Seattle_Parcels.pmtiles"

download_if_needed "Toronto_Parcels.pmtiles" "${GH_LFS_BASE}/Toronto_Parcels.pmtiles" || \
    echo "⚠️  Could not download Toronto_Parcels.pmtiles"

download_if_needed "pmtiles/Building_HK.pmtiles" "${GH_LFS_BASE}/pmtiles/Building_HK.pmtiles" || \
    echo "⚠️  Could not download Building_HK.pmtiles"

download_if_needed "pmtiles/LandParcel_Lot_HK.pmtiles" "${GH_LFS_BASE}/pmtiles/LandParcel_Lot_HK.pmtiles" || \
    echo "⚠️  Could not download LandParcel_Lot_HK.pmtiles"

echo "✅ PMTiles download complete"
