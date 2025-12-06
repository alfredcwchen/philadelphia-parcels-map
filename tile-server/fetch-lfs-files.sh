#!/bin/bash

# Fetch Git LFS files for DigitalOcean deployment
# This script downloads PMTiles files from GitHub LFS

set -e

echo "🔽 Fetching PMTiles files from Git LFS..."

# Check if git-lfs is installed
if ! command -v git-lfs &> /dev/null; then
    echo "📦 Installing Git LFS..."
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash
    apt-get install -y git-lfs || echo "Warning: Could not install git-lfs via apt"
fi

# Initialize git-lfs
git lfs install --skip-smudge 2>/dev/null || true

# Pull LFS files
echo "📥 Pulling LFS files..."
git lfs pull || {
    echo "⚠️  Git LFS pull failed, files may already be present or using placeholder"
    
    # Check if files are LFS pointers (small text files)
    if [ -f "Seattle_Parcels.pmtiles" ] && [ $(stat -f%z "Seattle_Parcels.pmtiles" 2>/dev/null || stat -c%s "Seattle_Parcels.pmtiles") -lt 1000 ]; then
        echo "🔧 Files are LFS pointers, attempting manual fetch..."
        git lfs fetch --all
        git lfs checkout
    fi
}

# Verify files
echo "✅ Verifying PMTiles files..."
for file in Seattle_Parcels.pmtiles Toronto_Parcels.pmtiles BC_Parcels.pmtiles pmtiles/Building_HK.pmtiles pmtiles/LandParcel_Lot_HK.pmtiles; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
        if [ $size -gt 1000000 ]; then
            echo "  ✓ $file: $(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "${size} bytes")"
        else
            echo "  ⚠️  $file: Only $size bytes (likely LFS pointer)"
        fi
    else
        echo "  ✗ $file: Not found"
    fi
done

echo "✅ LFS files fetch complete"
