# Vector Tiles Guide for Hong Kong Parcels

## Current Implementation

The app currently uses **GeoJSON** which Mapbox GL JS automatically converts to vector tiles client-side. This works well for up to ~10,000 features.

## For Production with Full Dataset (376,908 features)

To efficiently serve all Hong Kong parcels, use one of these approaches:

---

## Option 1: PMTiles (Recommended - Free & Easy)

PMTiles is a modern, cloud-optimized vector tile format that works great with static hosting.

### Steps:

1. **Install tippecanoe and pmtiles tools:**
```bash
# Install tippecanoe (converts GeoJSON to MBTiles)
brew install tippecanoe  # macOS
# or
git clone https://github.com/felt/tippecanoe.git
cd tippecanoe && make && sudo make install

# Install pmtiles CLI
npm install -g pmtiles
```

2. **Convert GeoJSON to MBTiles:**
```bash
tippecanoe -o hk_parcels.mbtiles \
  -Z12 -z18 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  -l parcels \
  --force \
  geoJSON/hk_parcels_full_wgs84.geojson
```

3. **Convert MBTiles to PMTiles:**
```bash
pmtiles convert hk_parcels.mbtiles hk_parcels.pmtiles
```

4. **Upload to static hosting:**
- Upload `hk_parcels.pmtiles` to DigitalOcean Spaces, S3, or any static host
- File will be ~100-200MB (much smaller than 933MB GeoJSON)

5. **Update your map code:**
```javascript
map.addSource('hk-land-pmtiles', {
    'type': 'vector',
    'url': 'pmtiles://https://your-bucket.s3.amazonaws.com/hk_parcels.pmtiles',
    'attribution': 'Hong Kong Land Registry'
});

map.addLayer({
    'id': 'hk-parcels-fill',
    'type': 'fill',
    'source': 'hk-land-pmtiles',
    'source-layer': 'parcels',
    'paint': {
        'fill-color': '#ff6600',
        'fill-opacity': 0.6
    }
});
```

**Advantages:**
- ✅ Works with free static hosting (DigitalOcean, S3, GitHub Pages)
- ✅ Efficient - only loads tiles for visible area
- ✅ Fast rendering
- ✅ No server required

---

## Option 2: Mapbox Tileset (Easy but Paid)

Upload your GeoJSON to Mapbox and let them handle tiling.

### Steps:

1. **Go to Mapbox Studio:**
   - https://studio.mapbox.com/tilesets/

2. **Upload GeoJSON:**
   - Click "New tileset"
   - Upload `hk_parcels_full_wgs84.geojson`
   - Wait for processing

3. **Get Tileset ID:**
   - Copy your tileset ID (e.g., `youruser.abc123`)

4. **Update map code:**
```javascript
map.addSource('hk-land-mapbox', {
    'type': 'vector',
    'url': 'mapbox://youruser.abc123'
});

map.addLayer({
    'id': 'hk-parcels-fill',
    'type': 'fill',
    'source': 'hk-land-mapbox',
    'source-layer': 'hk_parcels_full_wgs84',
    'paint': {
        'fill-color': '#ff6600',
        'fill-opacity': 0.6
    }
});
```

**Advantages:**
- ✅ Very easy to set up
- ✅ Optimized and fast
- ✅ Global CDN

**Disadvantages:**
- ❌ Costs money for large datasets
- ❌ Depends on Mapbox service

---

## Option 3: Self-Hosted Tile Server

Run your own tile server using Node.js.

### Steps:

1. **Create tile server:**
```javascript
// server.js
import express from 'express';
import fs from 'fs';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';

const app = express();
const data = JSON.parse(fs.readFileSync('geoJSON/hk_parcels_full_wgs84.geojson'));
const tileIndex = geojsonvt(data, { maxZoom: 18 });

app.get('/tiles/:z/:x/:y.pbf', (req, res) => {
    const { z, x, y } = req.params;
    const tile = tileIndex.getTile(parseInt(z), parseInt(x), parseInt(y));
    
    if (!tile) {
        res.status(204).send();
        return;
    }
    
    const pbf = vtpbf.fromGeojsonVt({ 'parcels': tile });
    res.setHeader('Content-Type', 'application/x-protobuf');
    res.send(Buffer.from(pbf));
});

app.listen(3000);
```

2. **Update map to use your server:**
```javascript
map.addSource('hk-land-tiles', {
    'type': 'vector',
    'tiles': ['http://localhost:3000/tiles/{z}/{x}/{y}.pbf'],
    'minzoom': 12,
    'maxzoom': 18
});
```

**Advantages:**
- ✅ Full control
- ✅ No recurring costs (except hosting)

**Disadvantages:**
- ❌ Requires server maintenance
- ❌ Need to handle scaling

---

## Current Setup (GeoJSON Client-Side)

**What you have now:**
```javascript
map.addSource('hk-land-geojson', {
    'type': 'geojson',
    'data': 'geoJSON/hk_parcels_distributed.geojson'
});
```

**Good for:**
- ✅ Development and testing
- ✅ Up to ~10,000-20,000 features
- ✅ Quick setup, no build process

**Limitations:**
- ❌ Full 376,908 features (933MB) is too large
- ❌ Must load entire file before showing any data
- ❌ Slower performance with large datasets

---

## Recommendation

For your use case (Hong Kong parcels on DigitalOcean):

**Development:** Use current GeoJSON approach with 10,000 feature sample ✅ (Already set up)

**Production:** Use **PMTiles** (Option 1)
- One-time conversion process
- Upload to DigitalOcean Spaces ($5/month for 250GB)
- Fast, efficient, scalable
- Works with your existing static hosting setup

---

## Quick Start with PMTiles

```bash
# 1. Convert to vector tiles
tippecanoe -o hk_parcels.mbtiles -Z12 -z18 --force geoJSON/hk_parcels_full_wgs84.geojson

# 2. Convert to PMTiles
pmtiles convert hk_parcels.mbtiles hk_parcels.pmtiles

# 3. Upload to DigitalOcean Spaces or S3

# 4. Update index.html to use PMTiles URL
```

That's it! Your map will now efficiently serve all 376,908 Hong Kong parcels.
