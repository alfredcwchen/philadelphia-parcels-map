const fs = require('fs');
const proj4 = require('proj4');

// Define Hong Kong 1980 Grid (EPSG:2326) projection
// Using official EPSG parameters with datum transformation
proj4.defs('EPSG:2326', '+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs');

// WGS84
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

console.log('Loading source file...');
const sourceFile = process.argv[2] || 'geoJSON/Lot_GEOJSON/LandParcel_Lot_PUBLIC_20251014.gdb_LOT_converted.json';
const outputFile = process.argv[3] || 'geoJSON/hk_parcels_precise_wgs84.geojson';
const samplingRate = parseInt(process.argv[4]) || 10; // Every Nth parcel

const data = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

console.log(`Total features: ${data.features.length.toLocaleString()}`);
console.log(`Sampling every ${samplingRate}th parcel...`);

// Sample features
const sampledFeatures = data.features.filter((_, index) => index % samplingRate === 0);
console.log(`Sampled features: ${sampledFeatures.length.toLocaleString()}`);

console.log('Transforming coordinates from EPSG:2326 to EPSG:4326...');

let processed = 0;
let errors = 0;
sampledFeatures.forEach((feature, index) => {
    if (index % 5000 === 0 && index > 0) {
        console.log(`  Progress: ${index.toLocaleString()}/${sampledFeatures.length.toLocaleString()} (${Math.round(index * 100 / sampledFeatures.length)}%)`);
    }
    
    try {
        // Transform each coordinate ring
        feature.geometry.coordinates = feature.geometry.coordinates.map(ring => {
            return ring.map(coord => {
                // Check if coordinates are valid numbers
                if (!isFinite(coord[0]) || !isFinite(coord[1])) {
                    errors++;
                    return coord; // Keep original if invalid
                }
                // coord is [x, y] in EPSG:2326
                const [lng, lat] = proj4('EPSG:2326', 'EPSG:4326', coord);
                return [lng, lat];
            });
        });
        processed++;
    } catch (e) {
        errors++;
        // Keep original coordinates on error
    }
});

const output = {
    type: 'FeatureCollection',
    features: sampledFeatures
};

console.log(`\nWriting to ${outputFile}...`);
fs.writeFileSync(outputFile, JSON.stringify(output));

const stats = fs.statSync(outputFile);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

console.log(`✓ Transformation complete!`);
console.log(`  Output: ${outputFile}`);
console.log(`  Features: ${processed.toLocaleString()}`);
console.log(`  Errors: ${errors}`);
console.log(`  Size: ${sizeMB} MB`);
console.log(`  Sampling: Every ${samplingRate}th parcel`);
console.log(`\nUsing official EPSG:2326 definition with 7-parameter datum transformation`);
console.log(`This should provide accurate alignment with Mapbox basemap.`);
