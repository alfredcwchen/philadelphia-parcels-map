# Vector Tiles Deployment Guide

## Why Vector Tiles?

**Benefits:**
- 📉 **Smaller file size**: ~5-10 MB instead of 87 MB
- ⚡ **Faster loading**: Only downloads tiles for visible area
- 🎨 **Better styling**: Can style parcels dynamically
- 🔍 **Zoom-dependent detail**: Shows more detail at higher zoom levels

**Trade-offs:**
- Requires build step to generate tiles
- Slightly more complex setup

---

## Step 1: Generate PMTiles

### Install Tippecanoe

```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential libsqlite3-dev zlib1g-dev

cd /tmp
git clone https://github.com/felt/tippecanoe.git
cd tippecanoe
make -j
sudo make install
```

### Convert GeoJSON to PMTiles

```bash
cd /workspaces/localretool

# Generate vector tiles (takes 1-2 minutes)
tippecanoe \
  -o geoJSON/hk_parcels.pmtiles \
  -Z10 -z16 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --force \
  geoJSON/hk_parcels_precise_wgs84.geojson
```

**Expected output:**
- File: `geoJSON/hk_parcels.pmtiles`
- Size: ~5-10 MB (much smaller than 87 MB GeoJSON)

---

## Step 2: Update index.html

Replace the Hong Kong GeoJSON source with PMTiles:

```javascript
// Add PMTiles protocol support
import { Protocol } from 'pmtiles';

const protocol = new Protocol();
mapboxgl.addProtocol('pmtiles', protocol.tile);

// Replace GeoJSON source with vector tiles
map.on('load', function() {
    // Remove this:
    // map.addSource('hk-parcels', {
    //     type: 'geojson',
    //     data: 'geoJSON/hk_parcels_precise_wgs84.geojson'
    // });
    
    // Add this instead:
    map.addSource('hk-parcels', {
        type: 'vector',
        url: 'pmtiles://./geoJSON/hk_parcels.pmtiles',
        attribution: 'Hong Kong Lands Department'
    });
    
    // Update layer to use vector tiles
    map.addLayer({
        id: 'hk-parcels-fill',
        type: 'fill',
        source: 'hk-parcels',
        'source-layer': 'hk_parcels_precise_wgs84', // Layer name from tippecanoe
        paint: {
            'fill-color': '#ff6600',
            'fill-opacity': 0.6
        },
        minzoom: 14
    });
    
    map.addLayer({
        id: 'hk-parcels-outline',
        type: 'line',
        source: 'hk-parcels',
        'source-layer': 'hk_parcels_precise_wgs84',
        paint: {
            'line-color': '#ff0000',
            'line-width': 2
        },
        minzoom: 14
    });
});
```

### Add PMTiles library to HTML

```html
<!-- In <head> section, before Mapbox GL JS -->
<script src="https://unpkg.com/pmtiles@3.0.3/dist/pmtiles.js"></script>
```

---

## Step 3: Update build.sh

```bash
#!/bin/bash

echo "Building with Mapbox token injection..."

# Create dist directory
mkdir -p dist
mkdir -p dist/geoJSON

# Copy HTML with token injection
sed "s/{{MAPBOX_ACCESS_TOKEN}}/$MAPBOX_ACCESS_TOKEN/g" index.html > dist/index.html

# Copy README
cp README.md dist/

# Copy PMTiles (much smaller than GeoJSON!)
echo "Copying vector tiles..."
cp geoJSON/hk_parcels.pmtiles dist/geoJSON/

FILE_SIZE=$(du -h dist/geoJSON/hk_parcels.pmtiles | cut -f1)

echo "Build completed successfully"
echo "Token injected and secured"
echo "Hong Kong vector tiles included: hk_parcels.pmtiles ($FILE_SIZE)"
```

---

## Step 4: Deploy to DigitalOcean

### Same as before, but with smaller files:

```bash
git add geoJSON/hk_parcels.pmtiles build.sh index.html
git commit -m "Switch to vector tiles for Hong Kong parcels"
git push
```

**Benefits of this approach:**
- ✅ Repository size: ~5-10 MB instead of 87 MB
- ✅ Faster git clone
- ✅ Faster deployments
- ✅ Users only download tiles they need
- ✅ Auto-deploy still works

---

## Alternative: Host PMTiles Separately

For even better performance, you can host PMTiles on a separate CDN:

### Option A: DigitalOcean Spaces (S3-compatible)

1. Create a Space (object storage)
2. Upload `hk_parcels.pmtiles`
3. Make it public
4. Update source URL:

```javascript
map.addSource('hk-parcels', {
    type: 'vector',
    url: 'pmtiles://https://your-space.nyc3.digitaloceanspaces.com/hk_parcels.pmtiles'
});
```

**Benefits:**
- Repository stays tiny
- Tiles served from CDN
- No git repo bloat

### Option B: GitHub Releases

1. Create a GitHub release
2. Attach `hk_parcels.pmtiles` as asset
3. Use the asset URL

---

## Comparison: GeoJSON vs Vector Tiles

| Aspect | GeoJSON (Current) | Vector Tiles |
|--------|------------------|--------------|
| File Size | 87.3 MB | ~5-10 MB |
| Load Time | Downloads all data | Downloads only visible area |
| Git Repo Size | +87 MB | +5-10 MB |
| Browser Memory | High | Low |
| Styling | Limited | Dynamic |
| Zoom Performance | Same data at all zooms | Optimized per zoom |
| Setup Complexity | Simple | Moderate |

---

## Recommended Approach

**For your use case, I recommend:**

1. **Generate PMTiles** from the GeoJSON
2. **Commit PMTiles to repo** (~5-10 MB is acceptable)
3. **Update index.html** to use vector tiles
4. **Keep auto-deploy** - it will work the same way

**Why this is better:**
- Much smaller repository
- Faster for users (only downloads what they see)
- Still simple deployment (no external hosting needed)
- Better performance at different zoom levels

---

## Full Implementation Checklist

- [ ] Install tippecanoe
- [ ] Generate `geoJSON/hk_parcels.pmtiles`
- [ ] Add PMTiles library to `index.html`
- [ ] Update source and layers to use vector tiles
- [ ] Update `build.sh` to copy `.pmtiles` instead of `.geojson`
- [ ] Test locally
- [ ] Commit and push
- [ ] Verify auto-deploy works
- [ ] Test deployed app

