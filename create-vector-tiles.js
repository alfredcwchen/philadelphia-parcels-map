/**
 * Convert Hong Kong GeoJSON to vector tiles using geojson-vt
 * This creates a tile index that can be served dynamically
 */

import fs from 'fs';
import geojsonvt from 'geojson-vt';

console.log('Loading Hong Kong GeoJSON data...');

// Use the distributed sample (24MB) for better performance
const data = JSON.parse(fs.readFileSync('geoJSON/hk_parcels_distributed.geojson', 'utf8'));

console.log(`Loaded ${data.features.length} features`);
console.log('Creating vector tile index...');

// Create tile index with geojson-vt
// This creates a spatial index that can quickly generate tiles at any zoom level
const tileIndex = geojsonvt(data, {
    maxZoom: 18,  // Maximum zoom level
    indexMaxZoom: 16, // Max zoom in the tile index
    indexMaxPoints: 100000, // Max points per tile in the index
    tolerance: 3, // Simplification tolerance
    extent: 4096, // Tile extent
    buffer: 64, // Tile buffer on each side
    debug: 1, // Logging level
    lineMetrics: false,
    promoteId: 'LOTID' // Use LOTID as feature ID
});

console.log('✓ Vector tile index created!');
console.log('\nTile index stats:');
console.log(`  Total tiles: ${tileIndex.total}`);
console.log(`  Features: ${data.features.length}`);

// Save the tile index as a serialized object for later use
const indexData = {
    tileIndex: tileIndex,
    stats: {
        features: data.features.length,
        created: new Date().toISOString()
    }
};

// For demonstration, let's generate a few sample tiles
console.log('\nGenerating sample tiles...');
const sampleTiles = [
    { z: 14, x: 13725, y: 7518 }, // Hong Kong area
    { z: 15, x: 27450, y: 15036 },
    { z: 16, x: 54900, y: 30072 }
];

sampleTiles.forEach(({ z, x, y }) => {
    const tile = tileIndex.getTile(z, x, y);
    if (tile) {
        console.log(`  Tile ${z}/${x}/${y}: ${tile.features ? tile.features.length : 0} features`);
    } else {
        console.log(`  Tile ${z}/${x}/${y}: No data`);
    }
});

console.log('\n✓ Vector tiles ready!');
console.log('\nTo use in your application:');
console.log('  1. Serve tiles dynamically using geojson-vt in a Node.js server');
console.log('  2. Or convert to MBTiles/PMTiles for static hosting');
console.log('  3. Or use Mapbox GL JS with the GeoJSON source (current approach)');
