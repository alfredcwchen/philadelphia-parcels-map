# Adding New Layers to the Map

This guide explains how to add new data layers to your map from Shapefile (.shp) or GeoJSON sources.

## Table of Contents
1. [Quick Overview](#quick-overview)
2. [Method 1: GeoJSON Direct Loading (Small Files)](#method-1-geojson-direct-loading-small-files)
3. [Method 2: PMTiles (Recommended for Large Files)](#method-2-pmtiles-recommended-for-large-files)
4. [Method 3: WMS Server](#method-3-wms-server)
5. [Adding Layer Controls](#adding-layer-controls)
6. [Troubleshooting](#troubleshooting)

---

## Quick Overview

**Choose your method based on file size:**
- **< 5 MB**: Use GeoJSON directly
- **5-100 MB**: Convert to PMTiles and use tile server
- **> 100 MB**: Consider WMS server or optimize data

---

## Method 1: GeoJSON Direct Loading (Small Files)

Best for files under 5 MB.

### Step 1: Prepare Your Data

#### If you have a Shapefile:
```bash
# Convert Shapefile to GeoJSON using ogr2ogr
ogr2ogr -f GeoJSON \
  -t_srs EPSG:4326 \
  output.geojson \
  input.shp

# Or using QGIS:
# 1. Open QGIS
# 2. Load your .shp file
# 3. Right-click layer → Export → Save Features As
# 4. Format: GeoJSON
# 5. CRS: EPSG:4326 - WGS 84
# 6. Save
```

#### If you already have GeoJSON:
```bash
# Ensure it's in WGS84 (EPSG:4326)
ogr2ogr -f GeoJSON \
  -t_srs EPSG:4326 \
  output_wgs84.geojson \
  input.geojson
```

### Step 2: Host the GeoJSON File

**Option A: Include in your repository**
```bash
# Place file in your project
cp output.geojson /path/to/project/data/my-layer.geojson
```

**Option B: Use external hosting**
- Upload to GitHub and use raw URL
- Use cloud storage (AWS S3, DigitalOcean Spaces, etc.)

### Step 3: Add Source and Layer to Map

Edit `index.html` and add your layer in the `map.on('load')` section:

```javascript
map.on('load', () => {
    // ... existing terrain and buildings code ...
    
    // Add your new layer source
    map.addSource('my-new-layer', {
        'type': 'geojson',
        'data': '/data/my-layer.geojson'  // or full URL
    });
    
    // Add fill layer
    map.addLayer({
        'id': 'my-layer-fill',
        'type': 'fill',  // or 'line', 'circle', 'symbol'
        'source': 'my-new-layer',
        'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.6
        },
        'layout': {
            'visibility': 'visible'  // or 'none' for hidden by default
        }
    });
    
    // Add outline layer (optional)
    map.addLayer({
        'id': 'my-layer-outline',
        'type': 'line',
        'source': 'my-new-layer',
        'paint': {
            'line-color': '#000',
            'line-width': 1
        },
        'layout': {
            'visibility': 'visible'
        }
    });
});
```

---

## Method 2: PMTiles (Recommended for Large Files)

Best for files 5 MB - 100+ MB. Uses vector tiles for efficient loading.

### Step 1: Convert to PMTiles

#### Option A: Using Tippecanoe (Recommended)
```bash
# Install tippecanoe
# On macOS:
brew install tippecanoe

# On Ubuntu/Debian:
git clone https://github.com/felt/tippecanoe.git
cd tippecanoe
make -j
sudo make install

# Convert GeoJSON to PMTiles
tippecanoe -o output.pmtiles \
  --layer=my_layer_name \
  --maximum-zoom=16 \
  --minimum-zoom=10 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  input.geojson
```

#### Option B: Using GDAL/OGR (Alternative)
```bash
# Convert Shapefile to MBTiles first
ogr2ogr -f MVT tiles/ input.shp \
  -dsco MINZOOM=10 \
  -dsco MAXZOOM=16

# Then convert MBTiles to PMTiles using go-pmtiles
go-pmtiles convert tiles.mbtiles output.pmtiles
```

### Step 2: Upload to Tile Server

```bash
# Copy PMTiles file to your tile server directory
cp output.pmtiles /path/to/tile-server/pmtiles/

# Your file should be alongside existing files:
# tile-server/pmtiles/
#   ├── Building_HK.pmtiles
#   ├── LandParcel_Lot_HK.pmtiles
#   └── output.pmtiles  <- Your new file
```

### Step 3: Update Tile Server (if needed)

The existing tile server automatically serves any `.pmtiles` files in the `pmtiles/` directory. The URL pattern is:
```
https://your-tile-server.com/SOURCE_NAME/{z}/{x}/{y}.pbf
```

Where `SOURCE_NAME` is the filename without `.pmtiles` extension.

For example, `output.pmtiles` becomes:
```
https://terratone-tiles-mfayf.ondigitalocean.app/output/{z}/{x}/{y}.pbf
```

### Step 4: Add Vector Tile Source to Map

Edit `index.html`:

```javascript
map.on('load', () => {
    // ... existing code ...
    
    // Add vector tile source
    map.addSource('my-vector-source', {
        'type': 'vector',
        'tiles': ['https://terratone-tiles-mfayf.ondigitalocean.app/output/{z}/{x}/{y}.pbf?v=1'],
        'minzoom': 10,
        'maxzoom': 16
    });
    
    // Add fill layer
    map.addLayer({
        'id': 'my-vector-fill',
        'type': 'fill',
        'source': 'my-vector-source',
        'source-layer': 'my_layer_name',  // Must match layer name in PMTiles
        'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.6
        },
        'layout': {
            'visibility': 'none'  // Hidden by default
        }
    });
    
    // Add outline layer
    map.addLayer({
        'id': 'my-vector-outline',
        'type': 'line',
        'source': 'my-vector-source',
        'source-layer': 'my_layer_name',
        'paint': {
            'line-color': '#000',
            'line-width': 1
        },
        'layout': {
            'visibility': 'none'
        }
    });
});
```

### Step 5: Deploy to DigitalOcean

```bash
# Commit your changes
cd /path/to/tile-server
git add pmtiles/output.pmtiles
git commit -m "Add new layer PMTiles"
git push

# DigitalOcean will automatically redeploy the tile server
```

---

## Method 3: WMS Server

Best for very large datasets or when you need server-side filtering.

### Step 1: Set Up WMS Server

You can use existing WMS servers like:
- GeoServer
- MapServer
- QGIS Server
- ArcGIS Server

Or use existing public WMS endpoints (like the Philadelphia parcels example).

### Step 2: Add WMS Source to Map

```javascript
map.on('load', () => {
    // Add WMS source
    map.addSource('my-wms-layer', {
        'type': 'raster',
        'tiles': [
            'https://your-wms-server.com/wms?' +
            'SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&' +
            'LAYERS=your_layer_name&STYLES=&FORMAT=image/png&' +
            'SRS=EPSG:3857&BBOX={bbox-epsg-3857}&' +
            'WIDTH=256&HEIGHT=256&TRANSPARENT=true'
        ],
        'tileSize': 256,
        'attribution': 'Your Data Source'
    });
    
    // Add WMS layer
    map.addLayer({
        'id': 'my-wms-layer',
        'type': 'raster',
        'source': 'my-wms-layer',
        'paint': {
            'raster-opacity': 0.7
        },
        'minzoom': 10
    });
});
```

---

## Adding Layer Controls

After adding your layer, add a toggle checkbox to the control panel.

### Step 1: Add Checkbox to HTML

Edit `index.html` and add to the Layers section:

```html
<div class="control-section">
    <div class="section-label">Layers</div>
    <div class="layer-toggle">
        <input type="checkbox" id="philly-toggle" checked>
        <label for="philly-toggle">Philadelphia Parcels</label>
    </div>
    <div class="layer-toggle">
        <input type="checkbox" id="hk-parcels-toggle">
        <label for="hk-parcels-toggle">Hong Kong Parcels</label>
    </div>
    <!-- ADD YOUR NEW LAYER TOGGLE HERE -->
    <div class="layer-toggle">
        <input type="checkbox" id="my-layer-toggle">
        <label for="my-layer-toggle">My New Layer</label>
    </div>
</div>
```

### Step 2: Add Toggle Event Listener

Add JavaScript to handle the toggle:

```javascript
// Add after map.on('load') section
document.getElementById('my-layer-toggle').addEventListener('change', function(e) {
    const visibility = e.target.checked ? 'visible' : 'none';
    
    // Toggle all related layers
    if (map.getLayer('my-layer-fill')) {
        map.setLayoutProperty('my-layer-fill', 'visibility', visibility);
    }
    if (map.getLayer('my-layer-outline')) {
        map.setLayoutProperty('my-layer-outline', 'visibility', visibility);
    }
});
```

### Step 3: Add to Style Switcher Restore Function

Update the `readdCustomLayers()` function to include your new layer:

```javascript
function readdCustomLayers() {
    // ... existing terrain, buildings, etc. ...
    
    // Re-add your custom layer
    if (!map.getSource('my-new-layer')) {
        map.addSource('my-new-layer', {
            'type': 'geojson',
            'data': '/data/my-layer.geojson'
        });
    }
    
    if (!map.getLayer('my-layer-fill')) {
        map.addLayer({
            'id': 'my-layer-fill',
            'type': 'fill',
            'source': 'my-new-layer',
            'paint': {
                'fill-color': '#088',
                'fill-opacity': 0.6
            },
            'layout': {
                'visibility': 'none'
            }
        });
    }
    
    // Add outline layer too...
}
```

### Step 4: Update Layer Visibility Preservation

In the style switcher code, add your layer IDs to the preservation list:

```javascript
document.getElementById('style-select-main').onchange = (e) => {
    const style = e.target.value;
    
    // Save current visibility state of all layers
    const layerVisibility = {};
    [
        'hk-parcels-fill', 
        'hk-parcels-outline', 
        'hk-buildings-fill', 
        'hk-buildings-outline', 
        'philly-parcels-wms-layer',
        'my-layer-fill',        // ADD YOUR LAYER HERE
        'my-layer-outline'      // AND HERE
    ].forEach(layerId => {
        const layer = map.getLayer(layerId);
        if (layer) {
            layerVisibility[layerId] = map.getLayoutProperty(layerId, 'visibility') || 'visible';
        }
    });
    
    // ... rest of style switcher code ...
};
```

---

## Troubleshooting

### Layer Not Showing

**Check the console for errors:**
```javascript
// Add debugging
console.log('Layer added:', map.getLayer('my-layer-fill'));
console.log('Source data:', map.getSource('my-new-layer'));
```

**Common issues:**
1. **Wrong CRS**: Ensure data is in EPSG:4326 (WGS84)
2. **Wrong source-layer name**: For PMTiles, must match layer name in the file
3. **Zoom level**: Check `minzoom`/`maxzoom` - you might be too zoomed in/out
4. **Visibility**: Layer might be set to `'none'`
5. **File path**: Check the GeoJSON URL is correct

### PMTiles Not Loading

**Check tile server:**
```bash
# Test the health endpoint
curl https://terratone-tiles-mfayf.ondigitalocean.app/health

# Test a specific tile
curl https://terratone-tiles-mfayf.ondigitalocean.app/output/10/500/300.pbf
```

**Check browser network tab:**
- Look for 404 errors (file not found)
- Look for 500 errors (server error)
- Check tile requests are being made

### Performance Issues

**For large GeoJSON files:**
1. Convert to PMTiles
2. Simplify geometry: `mapshaper -i input.geojson -simplify 10% -o output.geojson`
3. Filter unnecessary properties

**For PMTiles:**
1. Adjust zoom levels: `--maximum-zoom=14` instead of 16
2. Use `--drop-densest-as-needed` flag in tippecanoe
3. Simplify before converting: `tippecanoe --simplification=10`

### Style Not Applying

**Check paint properties:**
```javascript
// Valid fill properties
'fill-color': '#088'           // Hex color
'fill-color': 'rgb(0,136,136)' // RGB
'fill-color': ['get', 'color'] // Data-driven from properties

// Valid line properties
'line-color': '#000'
'line-width': 2
'line-dasharray': [2, 2]       // Dashed line
```

---

## Example: Complete Working Layer

Here's a complete example adding a "Parks" layer:

```javascript
// In map.on('load') section
map.addSource('parks-source', {
    'type': 'geojson',
    'data': '/data/parks.geojson'
});

map.addLayer({
    'id': 'parks-fill',
    'type': 'fill',
    'source': 'parks-source',
    'paint': {
        'fill-color': '#00aa00',
        'fill-opacity': 0.4
    },
    'layout': {
        'visibility': 'visible'
    }
});

map.addLayer({
    'id': 'parks-outline',
    'type': 'line',
    'source': 'parks-source',
    'paint': {
        'line-color': '#006600',
        'line-width': 2
    }
});

// Add click handler
map.on('click', 'parks-fill', (e) => {
    const properties = e.features[0].properties;
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
            <h3>${properties.name || 'Park'}</h3>
            <p>Area: ${properties.area || 'N/A'} acres</p>
        `)
        .addTo(map);
});

// Change cursor on hover
map.on('mouseenter', 'parks-fill', () => {
    map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseleave', 'parks-fill', () => {
    map.getCanvas().style.cursor = '';
});
```

---

## Useful Resources

- [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [Tippecanoe Documentation](https://github.com/felt/tippecanoe)
- [PMTiles Specification](https://github.com/protomaps/PMTiles)
- [GDAL/OGR Tools](https://gdal.org/)
- [GeoJSON Format](https://geojson.org/)

---

## Quick Reference: Layer Types

| Type | Use Case | Example |
|------|----------|---------|
| `fill` | Polygons (solid fill) | Land parcels, buildings, parks |
| `line` | Lines and polygon outlines | Roads, rivers, boundaries |
| `circle` | Points with circle style | POIs, markers, dots |
| `symbol` | Points with icons/text | Labels, icons, markers |
| `fill-extrusion` | 3D polygons | 3D buildings |
| `raster` | Image tiles | WMS, satellite imagery |
| `heatmap` | Density visualization | Point density maps |

---

## Need Help?

Check the browser console for errors and review the Mapbox GL JS documentation for detailed API information.
