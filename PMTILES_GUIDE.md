# PMTiles Management Guide

## Overview

This project uses PMTiles format for efficient vector tile storage and delivery. PMTiles are single-file archives of tiled data that support HTTP Range Requests, making them ideal for serverless and cloud-native deployments.

## Current PMTiles Inventory

| File | Size | Tiles | Zoom Levels | Coverage | Layer Name |
|------|------|-------|-------------|----------|------------|
| `Seattle_Parcels.pmtiles` | 536MB | 40,284 | 10-16 | Seattle, WA | seattle_parcels |
| `Toronto_Parcels.pmtiles` | 51MB | 4,910 | 10-16 | Toronto, ON | toronto_parcels |
| `LandParcel_Lot_HK.pmtiles` | 73MB | 4,310 | 10-16 | Hong Kong | land_parcels |
| `Building_HK.pmtiles` | 77MB | 4,206 | 12-16 | Hong Kong | buildings |

**Total Storage:** 737MB

---

## Installation

### Option 1: Go-based CLI (Recommended)

```bash
# Download and install
wget https://github.com/protomaps/go-pmtiles/releases/download/v1.21.0/go-pmtiles_1.21.0_Linux_x86_64.tar.gz
tar xzf go-pmtiles_1.21.0_Linux_x86_64.tar.gz pmtiles
sudo mv pmtiles /usr/local/bin/
rm go-pmtiles_1.21.0_Linux_x86_64.tar.gz

# Verify installation
pmtiles --version
```

### Option 2: macOS (Homebrew)

```bash
brew install pmtiles
```

### Option 3: Node.js (for development)

```bash
npm install -g @protomaps/pmtiles-cli
```

---

## Basic Commands

### 1. View Metadata

```bash
# Show file information
pmtiles show tile-server/Toronto_Parcels.pmtiles

# Show detailed tilestats
pmtiles show tile-server/Toronto_Parcels.pmtiles --json | jq '.tilestats'
```

**Example Output:**
```
pmtiles spec version: 3
tile type: Vector Protobuf (MVT)
bounds: (long: -79.638780, lat: 43.576018) (long: -79.116457, lat: 43.855329)
min zoom: 10
max zoom: 16
center: (long: -79.406433, lat: 43.646013)
tile entries count: 4911
```

### 2. Serve Locally

```bash
# Serve all PMTiles from a directory
pmtiles serve tile-server/

# Serve on custom port
pmtiles serve tile-server/ --port=8080

# Access tiles at:
# http://localhost:8080/Toronto_Parcels/{z}/{x}/{y}.pbf
```

### 3. Extract Region

Extract a subset of tiles for a specific geographic area:

```bash
# Extract downtown Toronto only
pmtiles extract tile-server/Toronto_Parcels.pmtiles toronto_downtown.pmtiles \
  --bbox=-79.4,-79.38,43.64,43.66

# Extract specific zoom levels
pmtiles extract tile-server/Toronto_Parcels.pmtiles toronto_lowzoom.pmtiles \
  --min-zoom=10 --max-zoom=13
```

### 4. Merge Multiple Files

```bash
# Combine multiple PMTiles into one
pmtiles merge combined.pmtiles file1.pmtiles file2.pmtiles file3.pmtiles

# Useful for combining different regions
```

### 5. Inspect Individual Tiles

```bash
# Get specific tile data
pmtiles tile tile-server/Toronto_Parcels.pmtiles 14 4650 6115

# Show tile as GeoJSON
pmtiles tile tile-server/Toronto_Parcels.pmtiles 14 4650 6115 --json
```

---

## Project-Specific Queries

### Toronto Parcels

```bash
# View metadata
pmtiles show tile-server/Toronto_Parcels.pmtiles

# Extract specific neighborhoods
# Downtown Toronto
pmtiles extract tile-server/Toronto_Parcels.pmtiles toronto_downtown.pmtiles \
  --bbox=-79.4,-79.38,43.64,43.66

# North York
pmtiles extract tile-server/Toronto_Parcels.pmtiles toronto_northyork.pmtiles \
  --bbox=-79.47,-79.35,43.72,43.78

# Scarborough
pmtiles extract tile-server/Toronto_Parcels.pmtiles toronto_scarborough.pmtiles \
  --bbox=-79.3,-79.15,43.70,43.82
```

### Seattle Parcels

```bash
# View metadata
pmtiles show tile-server/Seattle_Parcels.pmtiles

# Extract downtown Seattle
pmtiles extract tile-server/Seattle_Parcels.pmtiles seattle_downtown.pmtiles \
  --bbox=-122.36,-122.31,47.58,47.64

# Extract specific zoom levels (reduce file size)
pmtiles extract tile-server/Seattle_Parcels.pmtiles seattle_overview.pmtiles \
  --min-zoom=10 --max-zoom=13
```

### Hong Kong Parcels

```bash
# View parcel metadata
pmtiles show tile-server/pmtiles/LandParcel_Lot_HK.pmtiles

# Extract Hong Kong Island only
pmtiles extract tile-server/pmtiles/LandParcel_Lot_HK.pmtiles hk_island.pmtiles \
  --bbox=114.12,22.24,114.26,22.29

# Extract Kowloon Peninsula
pmtiles extract tile-server/pmtiles/LandParcel_Lot_HK.pmtiles hk_kowloon.pmtiles \
  --bbox=114.15,22.30,114.21,22.34
```

### Hong Kong Buildings

```bash
# View building metadata
pmtiles show tile-server/pmtiles/Building_HK.pmtiles

# Extract high-zoom detail only (buildings visible at zoom 14+)
pmtiles extract tile-server/pmtiles/Building_HK.pmtiles hk_buildings_detail.pmtiles \
  --min-zoom=14 --max-zoom=16
```

---

## Creating New PMTiles

### From GeoJSON

```bash
# Install tippecanoe (vector tile generator)
git clone https://github.com/felt/tippecanoe.git
cd tippecanoe
make -j
sudo make install

# Convert GeoJSON to PMTiles
tippecanoe -o output.pmtiles \
  -Z10 -z16 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=parcels \
  --force \
  input.geojson
```

### Project Template

```bash
# Standard conversion for parcel data
tippecanoe -o tile-server/YourCity_Parcels.pmtiles \
  -Z10 -z16 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=parcels \
  --force \
  geoJSON/YourCity/parcels.geojson

# For building footprints (start at higher zoom)
tippecanoe -o tile-server/YourCity_Buildings.pmtiles \
  -Z12 -z16 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=buildings \
  --force \
  geoJSON/YourCity/buildings.geojson
```

---

## Optimization Strategies

### 1. Reduce File Size

```bash
# More aggressive simplification
tippecanoe -o optimized.pmtiles \
  -Z10 -z14 \
  --simplification=10 \
  --drop-densest-as-needed \
  --drop-fraction-as-needed \
  input.geojson

# Keep only specific attributes
tippecanoe -o optimized.pmtiles \
  -y PARCELID -y ADDRESS -y OWNER \
  --drop-densest-as-needed \
  input.geojson
```

### 2. Split by Region

```bash
# Create low-zoom overview
tippecanoe -o city_overview.pmtiles -Z8 -z12 city.geojson

# Create high-zoom detail for downtown only
tippecanoe -o downtown_detail.pmtiles -Z13 -z16 downtown.geojson
```

### 3. Check Compression

```bash
# View compression statistics
pmtiles show file.pmtiles | grep compression

# Output:
# internal compression: 2  (gzip)
# tile compression: 2      (gzip)
```

---

## Using in QGIS

### Method 1: Direct File (QGIS 3.32+)

1. **Layer** → **Add Layer** → **Add Vector Tile Layer**
2. Choose **File** source type
3. Browse to `.pmtiles` file
4. Click **Add**

### Method 2: Via HTTP

1. **Layer** → **Add Layer** → **Add Vector Tile Layer**
2. Choose **New Generic Connection**
3. Enter URL:
   ```
   https://terratone-tiles-mfayf.ondigitalocean.app/Toronto_Parcels/{z}/{x}/{y}.pbf
   ```
4. Set Min zoom: 10, Max zoom: 16
5. Click **OK**

### All Layer URLs

```
Hong Kong Parcels:
https://terratone-tiles-mfayf.ondigitalocean.app/LandParcel_Lot_HK/{z}/{x}/{y}.pbf

Hong Kong Buildings:
https://terratone-tiles-mfayf.ondigitalocean.app/Building_HK/{z}/{x}/{y}.pbf

Seattle Parcels:
https://terratone-tiles-mfayf.ondigitalocean.app/Seattle_Parcels/{z}/{x}/{y}.pbf

Toronto Parcels:
https://terratone-tiles-mfayf.ondigitalocean.app/Toronto_Parcels/{z}/{x}/{y}.pbf
```

---

## Using in Web Maps

### Mapbox GL JS

```javascript
map.addSource('toronto-parcels', {
    type: 'vector',
    tiles: ['https://terratone-tiles-mfayf.ondigitalocean.app/Toronto_Parcels/{z}/{x}/{y}.pbf'],
    minzoom: 10,
    maxzoom: 16
});

map.addLayer({
    'id': 'toronto-parcels-fill',
    'type': 'fill',
    'source': 'toronto-parcels',
    'source-layer': 'toronto_parcels',
    'paint': {
        'fill-color': 'transparent',
        'fill-opacity': 0
    }
});

map.addLayer({
    'id': 'toronto-parcels-outline',
    'type': 'line',
    'source': 'toronto-parcels',
    'source-layer': 'toronto_parcels',
    'paint': {
        'line-color': '#808080',
        'line-width': 0.5
    }
});
```

### Direct PMTiles URL (with protomaps-leaflet)

```javascript
// Add PMTiles protocol
let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

map.addSource('toronto-parcels', {
    type: 'vector',
    url: 'pmtiles://https://your-bucket.s3.amazonaws.com/Toronto_Parcels.pmtiles'
});
```

---

## Troubleshooting

### Command Not Found

```bash
# Check installation
which pmtiles

# If not found, add to PATH
export PATH=$PATH:/usr/local/bin

# Or reinstall
wget https://github.com/protomaps/go-pmtiles/releases/download/v1.21.0/go-pmtiles_1.21.0_Linux_x86_64.tar.gz
tar xzf go-pmtiles_1.21.0_Linux_x86_64.tar.gz pmtiles
sudo mv pmtiles /usr/local/bin/
```

### File Too Large

```bash
# Check current size
ls -lh tile-server/*.pmtiles

# Reduce by lowering max zoom
tippecanoe -o smaller.pmtiles -Z10 -z14 input.geojson

# Or extract only needed region
pmtiles extract large.pmtiles smaller.pmtiles --bbox=minLon,minLat,maxLon,maxLat
```

### Tiles Not Loading in Browser

```bash
# Test locally first
pmtiles serve tile-server/ --port=8080

# Open browser to:
# http://localhost:8080/

# Check if tile server is running
curl https://terratone-tiles-mfayf.ondigitalocean.app/

# Test specific tile
curl https://terratone-tiles-mfayf.ondigitalocean.app/Toronto_Parcels/14/4650/6115.pbf
```

---

## Performance Tips

1. **Use HTTP Range Requests**: PMTiles are designed for cloud storage (S3, Spaces) - only requested tiles are downloaded
2. **Set Appropriate Zoom Levels**: Don't create tiles at zoom levels where they won't be visible
3. **Simplify Geometry**: Use `--simplification` flag for faster rendering
4. **Drop Dense Areas**: Use `--drop-densest-as-needed` to reduce file size
5. **Cache Locally**: For development, keep PMTiles local; for production, use CDN/object storage

---

## Additional Resources

- **PMTiles Specification**: https://github.com/protomaps/PMTiles
- **Tippecanoe Documentation**: https://github.com/felt/tippecanoe
- **PMTiles Viewer**: https://protomaps.github.io/PMTiles/
- **Mapbox Vector Tile Spec**: https://github.com/mapbox/vector-tile-spec

---

## Project Workflow

```bash
# 1. Convert GeoJSON to PMTiles
tippecanoe -o tile-server/NewCity_Parcels.pmtiles \
  -Z10 -z16 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=parcels \
  --force \
  geoJSON/NewCity/parcels.geojson

# 2. Verify the output
pmtiles show tile-server/NewCity_Parcels.pmtiles

# 3. Test locally
pmtiles serve tile-server/

# 4. Add to Git LFS (if < 100MB)
git lfs track "tile-server/*.pmtiles"
git add tile-server/NewCity_Parcels.pmtiles
git commit -m "Add NewCity parcels"
git push origin main

# 5. Update download-pmtiles.sh to fetch in production
# Add line in tile-server/download-pmtiles.sh:
# download_lfs_file "NewCity_Parcels.pmtiles"

# 6. Update index.html to add map layer
# See existing layers for code examples

# 7. Deploy to production
# Force redeploy tile server and web app on Digital Ocean
```
