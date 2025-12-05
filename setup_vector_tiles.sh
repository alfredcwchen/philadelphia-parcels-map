#!/bin/bash

echo "Installing tippecanoe for vector tile generation..."

# Install tippecanoe (required for generating vector tiles)
if ! command -v tippecanoe &> /dev/null; then
    echo "Installing tippecanoe..."
    sudo apt-get update
    sudo apt-get install -y build-essential libsqlite3-dev zlib1g-dev
    
    cd /tmp
    git clone https://github.com/felt/tippecanoe.git
    cd tippecanoe
    make -j
    sudo make install
    cd -
fi

echo "Converting Hong Kong GeoJSON to PMTiles..."

# Generate vector tiles from GeoJSON
tippecanoe \
  -o geoJSON/hk_parcels.pmtiles \
  -Z10 -z16 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --force \
  geoJSON/hk_parcels_precise_wgs84.geojson

echo "✓ Vector tiles created: geoJSON/hk_parcels.pmtiles"
ls -lh geoJSON/hk_parcels.pmtiles
