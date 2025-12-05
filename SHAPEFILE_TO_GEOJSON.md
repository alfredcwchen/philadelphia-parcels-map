# Converting Shapefiles to GeoJSON for Web Deployment

## Overview
Shapefiles (.shp) need to be converted to GeoJSON format for use in web mapping applications like Mapbox GL JS.

## Option 1: QGIS (Recommended - You Already Have This)

### Steps:
1. **Open your shapefile in QGIS**
   - Drag and drop the .shp file into QGIS

2. **Check the Coordinate System**
   - Right-click the layer → Properties → Information
   - Note the CRS (e.g., EPSG:2326 for Hong Kong Grid)

3. **Reproject to WGS84 (EPSG:4326)** - Required for web maps
   - Right-click layer → Export → Save Features As...
   - Format: `GeoJSON`
   - CRS: Select `EPSG:4326 - WGS 84`
   - File name: `hk_parcels.geojson` (or your preferred name)
   - Geometry type: Keep as is
   - Click OK

4. **Verify the output**
   - Add the exported GeoJSON back to QGIS
   - Check alignment with Mapbox basemap layers

### Optimization Tips in QGIS:
- **Simplify geometry** if file is too large:
  - Vector → Geometry Tools → Simplify
  - Try tolerance of 0.00001 (degrees) for WGS84
  - Test to ensure parcels still look accurate

- **Remove unnecessary fields**:
  - Right-click layer → Properties → Fields
  - Toggle editing mode
  - Delete columns you don't need for the web map
  - Save and re-export

## Option 2: Command Line (ogr2ogr)

```bash
# Install GDAL (if not already installed)
sudo apt-get install gdal-bin

# Convert shapefile to GeoJSON with reprojection
ogr2ogr -f GeoJSON \
  -t_srs EPSG:4326 \
  hk_parcels.geojson \
  your_shapefile.shp

# Simplify geometry to reduce file size (optional)
ogr2ogr -f GeoJSON \
  -t_srs EPSG:4326 \
  -simplify 0.00001 \
  hk_parcels_simplified.geojson \
  your_shapefile.shp
```

## Option 3: Node.js (Programmatic)

```bash
# Install shapefile package
npm install shapefile

# Create conversion script
```

```javascript
// convert-shp.js
const shapefile = require('shapefile');
const fs = require('fs');

async function convertShapefile() {
  const source = await shapefile.open('your_shapefile.shp');
  const features = [];
  
  let result;
  while (!(result = await source.read()).done) {
    features.push(result.value);
  }
  
  const geojson = {
    type: 'FeatureCollection',
    features: features
  };
  
  fs.writeFileSync('hk_parcels.geojson', JSON.stringify(geojson, null, 2));
  console.log('Conversion complete!');
}

convertShapefile();
```

```bash
# Run conversion
node convert-shp.js
```

## Integration Steps

### 1. Place GeoJSON file
```bash
# Copy your converted GeoJSON to the geoJSON directory
cp hk_parcels.geojson /workspaces/localretool/geoJSON/
```

### 2. Update index.html

Add this inside `map.on('load', function() {`:

```javascript
// Hong Kong Land Parcels Layer
map.addSource('hk-land-geojson', {
    'type': 'geojson',
    'data': 'geoJSON/hk_parcels.geojson',
    'generateId': true
});

map.addLayer({
    'id': 'hk-parcels-fill',
    'type': 'fill',
    'source': 'hk-land-geojson',
    'paint': {
        'fill-color': '#ff6600',
        'fill-opacity': 0.6
    },
    'layout': {
        'visibility': 'none'  // Hidden by default
    }
});

map.addLayer({
    'id': 'hk-parcels-outline',
    'type': 'line',
    'source': 'hk-land-geojson',
    'paint': {
        'line-color': '#ff0000',
        'line-width': 2
    },
    'layout': {
        'visibility': 'none'  // Hidden by default
    }
});
```

### 3. Add layer toggle (in HTML body)

```html
<div class="layer-toggle">
    <input type="checkbox" id="hk-toggle">
    <label for="hk-toggle">Hong Kong Parcels</label>
</div>
```

### 4. Add toggle handler (in JavaScript)

```javascript
document.getElementById('hk-toggle').addEventListener('change', function(e) {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('hk-parcels-fill', 'visibility', visibility);
    map.setLayoutProperty('hk-parcels-outline', 'visibility', visibility);
});
```

### 5. Add click handler for HK parcels

```javascript
// Inside map.on('click') handler, before Philadelphia WMS query:
const hkVisible = map.getLayoutProperty('hk-parcels-fill', 'visibility') !== 'none';

if (hkVisible) {
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['hk-parcels-fill']
    });
    
    if (features.length > 0) {
        const feature = features[0];
        
        let popupContent = '<div class="popup-container">';
        popupContent += '<div class="popup-title">Hong Kong Parcel</div>';
        popupContent += '<div class="scrollable-content">';
        popupContent += '<table class="property-table">';
        
        for (const [key, value] of Object.entries(feature.properties)) {
            if (value !== null && value !== undefined && value !== '') {
                popupContent += `<tr><td class="prop-key">${key}</td><td class="prop-value">${value}</td></tr>`;
            }
        }
        
        popupContent += '</table></div></div>';
        
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);
        
        isClickProcessing = false;
        return;
    }
}
```

### 6. Update build.sh

```bash
# Copy GeoJSON data files
mkdir -p dist/geoJSON
cp geoJSON/hk_parcels.geojson dist/geoJSON/
```

## File Size Considerations

- **GeoJSON** is text-based, so large datasets can be 50-100+ MB
- **Optimization strategies**:
  1. Simplify geometry (reduce coordinate precision)
  2. Remove unnecessary attributes
  3. Consider vector tiles (PMTiles) for very large datasets
  4. Use gzip compression (DigitalOcean serves this automatically)

## Testing Checklist

- [ ] File loads without errors in browser console
- [ ] Parcels appear at correct geographic location
- [ ] Parcels align with Mapbox basemap
- [ ] Click events show property information
- [ ] Layer toggle works correctly
- [ ] File size is acceptable for deployment

## Troubleshooting

### Parcels not showing
- Check browser console for errors
- Verify GeoJSON is valid: https://geojson.io
- Check CRS is EPSG:4326
- Verify file path in `addSource()`

### Wrong location
- Shapefile probably wasn't reprojected to EPSG:4326
- Re-export from QGIS with correct CRS

### File too large
- Simplify geometry in QGIS
- Remove unnecessary attributes
- Consider splitting into multiple files by region

## Next Steps

1. Convert your shapefile using QGIS (recommended)
2. Test the GeoJSON in https://geojson.io to verify coordinates
3. Copy to `geoJSON/` directory
4. Update `index.html` with the code snippets above
5. Test locally with `./dev-build.sh`
6. Update `build.sh` to copy the file
7. Deploy to DigitalOcean
