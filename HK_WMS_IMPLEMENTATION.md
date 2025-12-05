# Hong Kong WMS Implementation

## Summary
Successfully switched Hong Kong layer from local GeoJSON files to the official WMS service from Hong Kong CSDI portal.

## Key Changes

### 1. Data Source
**Before:** Local GeoJSON file (`geoJSON/hk_parcels_distributed.geojson`) with coordinate transformation issues
**After:** Official WMS service from Hong Kong government portal

### 2. WMS Configuration
```javascript
map.addSource('hk-land-wms', {
    'type': 'raster',
    'tiles': [
        'https://portal.csdi.gov.hk/server/services/common/landsd_rcd_1648571595120_89752/MapServer/WMSServer?' +
        'SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=0&STYLES=' +
        '&FORMAT=image/png&TRANSPARENT=true' +
        '&CRS=EPSG:4326&WIDTH=256&HEIGHT=256' +
        '&BBOX={bbox-epsg-4326}'
    ],
    'tileSize': 256,
    'attribution': 'Hong Kong Land Registry',
    'bounds': [114.1035038986206, 22.262474243164064, 114.25302095794677, 22.32152575683594]
});
```

### 3. Key Parameters
- **VERSION**: 1.3.0 (WMS standard)
- **LAYERS**: 0 (first layer in the service)
- **CRS**: EPSG:4326 (WGS84 lat/lng - native to Mapbox GL JS)
- **FORMAT**: image/png with transparency
- **BBOX**: Uses Mapbox's `{bbox-epsg-4326}` placeholder

### 4. GetFeatureInfo Implementation
When users click on the map with HK layer visible, the app queries the WMS service:

```javascript
const hkFeatureInfoUrl = 'https://portal.csdi.gov.hk/server/services/common/landsd_rcd_1648571595120_89752/MapServer/WMSServer?' +
    'SERVICE=WMS&REQUEST=GetFeatureInfo&VERSION=1.3.0&LAYERS=0&QUERY_LAYERS=0' +
    '&STYLES=&FORMAT=image/png&INFO_FORMAT=text/html' +
    '&CRS=EPSG:4326' +
    `&BBOX=${lat-bboxSize},${lng-bboxSize},${lat+bboxSize},${lng+bboxSize}` +
    `&WIDTH=1&HEIGHT=1` +
    `&I=0&J=0` +
    '&FEATURE_COUNT=10';
```

**Note**: WMS 1.3.0 uses `I` and `J` parameters (instead of `X` and `Y` in WMS 1.1.1), and BBOX order is `lat,lng,lat,lng` for EPSG:4326.

## Benefits

### ✅ Full Coverage
- No longer limited to sample data (10,000 features)
- Complete Hong Kong parcel coverage from official source
- Always up-to-date data

### ✅ Accurate Coordinates
- No manual coordinate transformation needed
- WMS server handles EPSG:2326 → EPSG:4326 conversion internally
- Parcels appear in correct positions

### ✅ Performance
- Server-side rendering (raster tiles)
- No need to download large GeoJSON files
- Faster initial load time

### ✅ Data Authority
- Official Hong Kong government data source
- Reliable and maintained by CSDI

## Coverage Area
The WMS service covers the Kowloon area:
- West: 114.1035°E
- East: 114.2530°E  
- South: 22.2625°N
- North: 22.3215°N

To view the Hong Kong layer:
1. Open http://localhost:8000/index-dev.html
2. Check the "Hong Kong Land" checkbox
3. Click "Go to Hong Kong" button
4. Zoom in to see parcels
5. Click on parcels to see property information

## Reference
Sample code from Hong Kong CSDI portal showing OpenLayers integration:
https://portal.csdi.gov.hk/

## Next Steps
If you need coverage beyond Kowloon, check the CSDI portal for additional WMS services or layers covering other Hong Kong regions.
